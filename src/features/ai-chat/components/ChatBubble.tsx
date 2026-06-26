import { Image } from "expo-image";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { COLORS } from "@/shared/colors";
import { ChatMessage } from "../hooks/useAIChat";
import { PERSONA_AVATAR } from "../hooks/useAIChat";

interface Props {
  message: ChatMessage;
}

// Cheap manual format — avoids Intl.DateTimeFormat overhead per bubble
function formatTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.getHours().toString().padStart(2, "0") +
    ":" +
    d.getMinutes().toString().padStart(2, "0")
  );
}

export const ChatBubble = memo(function ChatBubble({ message }: Props) {
  const isUser = message.role === "user";
  const time = formatTime(message.created_at);

  if (isUser) {
    return (
      <Animated.View entering={FadeIn.duration(220)} style={s.rowUser}>
        <View style={[s.bubbleUser, message.queued && s.bubbleQueued]}>
          <Text style={s.textUser}>{message.content}</Text>
          <Text style={s.timeUser}>
            {message.queued ? "⏳ не отправлено" : time}
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(220)} style={s.rowBot}>
      <Image source={{ uri: PERSONA_AVATAR }} style={s.avatar} contentFit="cover" />
      <View style={s.bubbleBot}>
        <Text style={s.textBot}>{message.content}</Text>
        <Text style={s.timeBot}>{time}</Text>
      </View>
    </Animated.View>
  );
});

const s = StyleSheet.create({
  rowUser: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginHorizontal: 16,
    marginVertical: 4,
  },
  rowBot: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginHorizontal: 16,
    marginVertical: 4,
    gap: 8,
  },

  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.greyLight,
  },

  bubbleUser: {
    maxWidth: "75%",
    backgroundColor: COLORS.brandNavy,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  bubbleQueued: {
    opacity: 0.65,
  },
  // Solid color instead of LinearGradient — removes GPU compositing layer per bubble
  bubbleBot: {
    maxWidth: "75%",
    backgroundColor: "#F2F2F2",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },

  textUser: { fontSize: 14, lineHeight: 20, color: COLORS.white },
  textBot: { fontSize: 14, lineHeight: 20, color: COLORS.text1 },

  timeUser: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    textAlign: "right",
    marginTop: 4,
  },
  timeBot: {
    fontSize: 11,
    color: COLORS.text3,
    textAlign: "right",
    marginTop: 4,
  },
});
