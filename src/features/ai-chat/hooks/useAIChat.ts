import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  publicSupabase,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from "@/shared/supabase/publicClient";

export type MessageRole = "user" | "assistant";
export type ContactStep = "name" | "phone" | "completed";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  created_at: string;
  boat_cards?: any[];
  pending?: boolean;
}

const SESSION_KEY = "ai_chat_session_id";
const MESSAGES_CACHE_KEY = "ai_chat_messages_cache";
const CONTACT_NAME_KEY = "ai_chat_contact_name";
const CONTACT_PHONE_KEY = "ai_chat_contact_phone";

export const PERSONA_AVATAR =
  "https://rbs.rent/rbs-assets/87dade44-2803-4446-bc4d-722223edff4a.png";
export const PERSONA_NAME = "Елизавета";

const WELCOME_TEXT =
  "Привет! Меня зовут Елизавета, я менеджер по бронированию в RBS.RENT ⛵️ Помогу подобрать идеальный катер для вашей прогулки по Петербургу! Расскажите, что планируете? 😊\n\nДля начала, расскажите, как вас зовут? 😊";

function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function extractLikelyName(text: string): string | null {
  const t = text.trim();
  if (t.includes("?")) return null;
  const questionWords =
    /\b(как|где|когда|почём|сколько|что|кто|какой|какая|хочу|нужно|нужен|есть|можно|подскажи|расскажи|покажи|ищу|планирую|хотим|нам|нас|мне|хотела|хотел)\b/i;
  if (questionWords.test(t)) return null;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 3) return null;
  const namePattern = /^[А-ЯЁA-Zа-яёa-z]{2,}$/;
  if (!words.every((w) => namePattern.test(w))) return null;
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function normalizeRuPhone(text: string): string | null {
  const digits = text.replace(/\D/g, "");
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return "+7" + digits.slice(1);
  }
  if (digits.length === 10) return "+7" + digits;
  return null;
}

// Best-effort — never throws
async function ensureChatRow(sessionId: string) {
  try {
    const { data } = await publicSupabase
      .from("ai_chats")
      .select("session_id")
      .eq("session_id", sessionId)
      .maybeSingle();
    if (!data) {
      await publicSupabase.from("ai_chats").insert({ session_id: sessionId, chat_mode: "bot" });
    }
  } catch {}
}

// Best-effort — never throws, returns generated ID on failure
async function persistMessage(
  sessionId: string,
  role: MessageRole,
  content: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  try {
    const { data } = await publicSupabase
      .from("ai_chat_messages")
      .insert({ session_id: sessionId, role, content, metadata: metadata ?? null })
      .select("id")
      .single();
    return data?.id ?? generateId();
  } catch {
    return generateId();
  }
}

function cacheMessages(msgs: ChatMessage[]) {
  // Strip pending flag and boat_cards from cache to keep it lean
  const toSave = msgs
    .filter((m) => !m.pending)
    .map(({ id, role, content, created_at }) => ({ id, role, content, created_at }));
  AsyncStorage.setItem(MESSAGES_CACHE_KEY, JSON.stringify(toSave)).catch(() => {});
}

export function useAIChat() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [contactStep, setContactStep] = useState<ContactStep>("name");
  const [contactName, setContactName] = useState<string | null>(null);

  const historyRef = useRef<{ role: MessageRole; content: string }[]>([]);
  const contactNameRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Persist to AsyncStorage whenever messages change (skip pending)
  useEffect(() => {
    if (messages.length === 0) return;
    cacheMessages(messages);
  }, [messages]);

  useEffect(() => {
    (async () => {
      const [sid0, savedName, savedPhone, cachedRaw] = await Promise.all([
        AsyncStorage.getItem(SESSION_KEY),
        AsyncStorage.getItem(CONTACT_NAME_KEY),
        AsyncStorage.getItem(CONTACT_PHONE_KEY),
        AsyncStorage.getItem(MESSAGES_CACHE_KEY),
      ]);

      let sid = sid0;
      if (!sid) {
        sid = generateId();
        await AsyncStorage.setItem(SESSION_KEY, sid);
      }
      setSessionId(sid);
      sessionIdRef.current = sid;

      if (savedName) {
        contactNameRef.current = savedName;
        setContactName(savedName);
      }
      if (savedName && savedPhone) setContactStep("completed");
      else if (savedName) setContactStep("phone");

      // Load from AsyncStorage cache immediately (no network wait)
      if (cachedRaw) {
        try {
          const cached: ChatMessage[] = JSON.parse(cachedRaw);
          if (cached.length > 0) {
            setMessages(cached);
            historyRef.current = cached.map((m) => ({ role: m.role, content: m.content }));
            // DB sync in background — don't block UI
            syncFromDb(sid);
            // Check admin mode in background
            checkAdminMode(sid, setIsAdminMode);
            return;
          }
        } catch {}
      }

      // No cache — first ever open or cache cleared
      const [{ data: chat }, { data: msgs }] = await Promise.all([
        publicSupabase.from("ai_chats").select("chat_mode").eq("session_id", sid).maybeSingle(),
        publicSupabase
          .from("ai_chat_messages")
          .select("id,role,content,created_at,metadata")
          .eq("session_id", sid)
          .order("created_at", { ascending: true }),
      ]);

      if (chat?.chat_mode === "admin") setIsAdminMode(true);

      if (msgs && msgs.length > 0) {
        const mapped: ChatMessage[] = msgs.map((m: any) => ({
          id: m.id,
          role: m.role as MessageRole,
          content: m.content,
          created_at: m.created_at,
          boat_cards: m.metadata?.boats_with_photos ?? undefined,
        }));
        setMessages(mapped);
        historyRef.current = mapped.map((m) => ({ role: m.role, content: m.content }));
      } else {
        // Truly first open
        await ensureChatRow(sid);
        const dbId = await persistMessage(sid, "assistant", WELCOME_TEXT);
        const welcome: ChatMessage = {
          id: dbId,
          role: "assistant",
          content: WELCOME_TEXT,
          created_at: new Date().toISOString(),
        };
        setMessages([welcome]);
        historyRef.current = [{ role: "assistant", content: WELCOME_TEXT }];
      }
    })();
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!sessionId) return;

    const msgChannel = publicSupabase
      .channel(`ai_chat_messages:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ai_chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const m = payload.new as any;
          setMessages((prev) => {
            const pendingIdx = prev.findIndex(
              (x) => x.pending && x.role === m.role && x.content === m.content
            );
            if (pendingIdx !== -1) {
              const next = [...prev];
              next[pendingIdx] = {
                id: m.id,
                role: m.role,
                content: m.content,
                created_at: m.created_at,
                boat_cards: m.metadata?.boats_with_photos ?? undefined,
              };
              return next;
            }
            if (prev.find((x) => x.id === m.id)) return prev;
            const msg: ChatMessage = {
              id: m.id,
              role: m.role,
              content: m.content,
              created_at: m.created_at,
              boat_cards: m.metadata?.boats_with_photos ?? undefined,
            };
            historyRef.current.push({ role: msg.role, content: msg.content });
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    const chatChannel = publicSupabase
      .channel(`ai_chats:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ai_chats",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setIsAdminMode(payload.new?.chat_mode === "admin");
        }
      )
      .subscribe();

    return () => {
      publicSupabase.removeChannel(msgChannel);
      publicSupabase.removeChannel(chatChannel);
    };
  }, [sessionId]);

  const sendMessage = useCallback(
    async (text: string) => {
      const sid = sessionIdRef.current;
      if (!sid || isLoading || !text.trim()) return;

      const trimmed = text.trim();
      const tempId = `pending-${generateId()}`;
      const userMsg: ChatMessage = {
        id: tempId,
        role: "user",
        content: trimmed,
        created_at: new Date().toISOString(),
        pending: true,
      };
      setMessages((prev) => [...prev, userMsg]);
      historyRef.current.push({ role: "user", content: trimmed });

      // Fast-path: name
      if (contactStep === "name") {
        const hasQuestion = trimmed.includes("?");
        const hasQuestionWord =
          /\b(как|где|когда|почём|сколько|что|кто|какой|хочу|нужно|ищу|планирую)\b/i.test(trimmed);

        if (!hasQuestion && !hasQuestionWord) {
          const name = extractLikelyName(trimmed);
          if (name) {
            contactNameRef.current = name;
            setContactName(name);
            setContactStep("phone");
            await AsyncStorage.setItem(CONTACT_NAME_KEY, name);

            const botText = `Приятно познакомиться, ${name}! 😊 Теперь, пожалуйста, укажите ваш номер телефона, чтобы я могла сохранить вашу заявку.`;
            const userDbId = generateId();
            const botDbId = generateId();

            setMessages((prev) => {
              const next = prev.map((m) =>
                m.id === tempId ? { ...m, id: userDbId, pending: false } : m
              );
              return [
                ...next,
                { id: botDbId, role: "assistant" as MessageRole, content: botText, created_at: new Date().toISOString() },
              ];
            });
            historyRef.current.push({ role: "assistant", content: botText });

            // DB sync in background
            Promise.all([
              persistMessage(sid, "user", trimmed),
              persistMessage(sid, "assistant", botText),
            ]).catch(() => {});
            return;
          }
        }
      }

      // Fast-path: phone
      if (contactStep === "phone") {
        const phone = normalizeRuPhone(trimmed);
        if (phone) {
          const name = contactNameRef.current ?? "Клиент";
          setContactStep("completed");
          await AsyncStorage.setItem(CONTACT_PHONE_KEY, phone);

          const botText = `Спасибо, ${name}! Телефон сохранила. 😊 Теперь помогу подобрать катер — расскажите, какая дата, время и сколько гостей планируется?`;
          const userDbId = generateId();
          const botDbId = generateId();

          setMessages((prev) => {
            const next = prev.map((m) =>
              m.id === tempId ? { ...m, id: userDbId, pending: false } : m
            );
            return [
              ...next,
              { id: botDbId, role: "assistant" as MessageRole, content: botText, created_at: new Date().toISOString() },
            ];
          });
          historyRef.current.push({ role: "assistant", content: botText });

          Promise.all([
            persistMessage(sid, "user", trimmed),
            persistMessage(sid, "assistant", botText),
          ]).catch(() => {});
          return;
        }
      }

      // OpenAI path
      setIsLoading(true);
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat-assistant`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            message: trimmed,
            sessionId: sid,
            conversationHistory: historyRef.current.slice(-20),
          }),
        });

        const data = await res.json();

        if (data?.response) {
          const botMsg: ChatMessage = {
            id: generateId(),
            role: "assistant",
            content: data.response,
            created_at: new Date().toISOString(),
            boat_cards: data.boats_with_photos ?? undefined,
          };
          setMessages((prev) => {
            const next = prev.map((m) => (m.id === tempId ? { ...m, pending: false } : m));
            if (next.find((m) => m.id === botMsg.id)) return next;
            return [...next, botMsg];
          });
          historyRef.current.push({ role: "assistant", content: botMsg.content });
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, pending: false } : m))
        );
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, isLoading, contactStep]
  );

  const resetSession = useCallback(async () => {
    const sid = generateId();
    await Promise.all([
      AsyncStorage.setItem(SESSION_KEY, sid),
      AsyncStorage.removeItem(CONTACT_NAME_KEY),
      AsyncStorage.removeItem(CONTACT_PHONE_KEY),
      AsyncStorage.removeItem(MESSAGES_CACHE_KEY),
    ]);
    sessionIdRef.current = sid;
    setSessionId(sid);
    setIsAdminMode(false);
    setContactStep("name");
    setContactName(null);
    contactNameRef.current = null;
    historyRef.current = [];

    const welcome: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: WELCOME_TEXT,
      created_at: new Date().toISOString(),
    };
    setMessages([welcome]);
    historyRef.current = [{ role: "assistant", content: WELCOME_TEXT }];

    // DB in background
    ensureChatRow(sid)
      .then(() => persistMessage(sid, "assistant", WELCOME_TEXT))
      .catch(() => {});
  }, []);

  const inputPlaceholder =
    contactStep === "name"
      ? "Напишите ваше имя или задайте вопрос..."
      : contactStep === "phone"
      ? "Введите номер телефона..."
      : "Напишите сообщение...";

  return {
    messages,
    isLoading,
    isAdminMode,
    contactStep,
    contactName,
    inputPlaceholder,
    sendMessage,
    resetSession,
    sessionId,
    PERSONA_AVATAR,
    PERSONA_NAME,
  };
}

// Background helpers — called outside render cycle
async function syncFromDb(sessionId: string) {
  try {
    const { data: msgs } = await publicSupabase
      .from("ai_chat_messages")
      .select("id,role,content,created_at,metadata")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (msgs && msgs.length > 0) {
      const mapped: ChatMessage[] = msgs.map((m: any) => ({
        id: m.id,
        role: m.role as MessageRole,
        content: m.content,
        created_at: m.created_at,
        boat_cards: m.metadata?.boats_with_photos ?? undefined,
      }));
      cacheMessages(mapped);
    }
  } catch {}
}

async function checkAdminMode(sessionId: string, setIsAdminMode: (v: boolean) => void) {
  try {
    const { data } = await publicSupabase
      .from("ai_chats")
      .select("chat_mode")
      .eq("session_id", sessionId)
      .maybeSingle();
    if (data?.chat_mode === "admin") setIsAdminMode(true);
  } catch {}
}
