import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { RefreshCw, Send, X } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  FlatList,
  KeyboardAvoidingView,
  ListRenderItem,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/shared/colors";
import { ChatBubble } from "../components/ChatBubble";
import { TypingDots } from "../components/TypingDots";
import { ChatMessage, useAIChat } from "../hooks/useAIChat";

const TYPING_ID = "__typing__";

type ListItem = ChatMessage | { id: typeof TYPING_ID; _typing: true };

function isTyping(item: ListItem): item is { id: typeof TYPING_ID; _typing: true } {
  return item.id === TYPING_ID;
}

const keyExtractor = (m: ListItem) => m.id;

export function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    messages,
    isLoading,
    isAdminMode,
    inputPlaceholder,
    sendMessage,
    resetSession,
    PERSONA_AVATAR,
    PERSONA_NAME,
  } = useAIChat();

  const [input, setInput] = useState("");
  const listRef = useRef<FlatList<ListItem>>(null);

  const canSend = input.trim().length > 0 && !isLoading;

  // Typing bubble injected as last list item when loading
  const listData = useMemo<ListItem[]>(
    () => (isLoading ? [...messages, { id: TYPING_ID, _typing: true }] : messages),
    [messages, isLoading]
  );

  const renderItem: ListRenderItem<ListItem> = useCallback(
    ({ item }) => {
      if (isTyping(item)) {
        return (
          <Animated.View entering={FadeIn.duration(200)} style={s.typingRow}>
            <Image source={{ uri: PERSONA_AVATAR }} style={s.typingAvatar} contentFit="cover" />
            <View style={s.typingBubble}>
              <TypingDots />
            </View>
          </Animated.View>
        );
      }
      return <ChatBubble message={item} />;
    },
    [PERSONA_AVATAR]
  );

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage(text);
  }, [input, isLoading, sendMessage]);

  return (
    <View style={s.root}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.brandNavy, COLORS.brandCyan]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.header}
      >
        <View style={s.headerLeft}>
          <Image source={{ uri: PERSONA_AVATAR }} style={s.headerAvatar} contentFit="cover" />
          <View>
            <Text style={s.headerName}>{PERSONA_NAME}</Text>
            <Text style={s.headerRole}>
              {isAdminMode ? "Онлайн · менеджер" : "менеджер RBS.RENT"}
            </Text>
          </View>
        </View>
        <View style={s.headerActions}>
          <Pressable style={s.iconBtn} onPress={resetSession} hitSlop={8}>
            <RefreshCw size={16} color="rgba(255,255,255,0.8)" strokeWidth={2} />
          </Pressable>
          <Pressable style={s.iconBtn} onPress={() => router.back()} hitSlop={8}>
            <X size={18} color="rgba(255,255,255,0.8)" strokeWidth={2} />
          </Pressable>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={listData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          onContentSizeChange={scrollToBottom}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === "android"}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          initialNumToRender={20}
        />

        {isAdminMode && (
          <View style={s.adminBanner}>
            <Text style={s.adminText}>Менеджер подключился к чату</Text>
          </View>
        )}

        <View style={[s.inputRow, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder={inputPlaceholder}
            placeholderTextColor={COLORS.text3}
            multiline
            maxLength={500}
            returnKeyType="default"
          />
          <Pressable
            style={canSend ? s.sendBtn : s.sendBtnDisabled}
            onPress={handleSend}
            disabled={!canSend}
            hitSlop={4}
          >
            <Send size={18} color={COLORS.white} strokeWidth={2} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerName: { fontSize: 15, fontWeight: "600", color: COLORS.white },
  headerRole: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 6 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  list: { paddingVertical: 12 },

  typingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  typingAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.greyLight,
  },
  typingBubble: {
    backgroundColor: "#F2F2F2",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  adminBanner: {
    backgroundColor: COLORS.successLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  adminText: { fontSize: 13, color: COLORS.success, textAlign: "center", fontWeight: "500" },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.greyLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 14,
    color: COLORS.text1,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brandNavy,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.greyDark,
    alignItems: "center",
    justifyContent: "center",
  },
});
