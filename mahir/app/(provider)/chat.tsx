import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Send } from "lucide-react-native";
import { Colors, Typography, Radii } from "@/constants/design-tokens";
import { useAuthStore } from "@/store/authStore";



interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "agent";
  timestamp: Date;
}

export default function ChatScreen() {
  const router = useRouter();
  const { initialMessage } = useLocalSearchParams<{ initialMessage: string }>();
  const userName = useAuthStore((s) => s.userName) ?? "Client";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Initialize with greeting and optional initial message
  useEffect(() => {
    const greeting: ChatMessage = {
      id: "greeting",
      text: `Hello ${userName}! I am your Mahir Agent. I can help you check your earnings, manage your schedule, or find nearby jobs. What do you need?`,
      sender: "agent",
      timestamp: new Date(),
    };
    
    setMessages([greeting]);

    if (initialMessage && initialMessage.trim().length > 0) {
      setTimeout(() => {
        handleSend(initialMessage);
      }, 500);
    }
  }, []);

  const handleSend = (text: string = inputText) => {
    const trimmedText = text.trim();
    if (trimmedText.length === 0) return;

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      text: trimmedText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputText("");
    setIsTyping(true);

    // Auto-scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Simulate Agent Response
    setTimeout(() => {
      let replyText = "I'm checking that for you now...";
      if (trimmedText.toLowerCase().includes("earnings") || trimmedText.toLowerCase().includes("money")) {
        replyText = "You've earned Rs 12,500 this week from 4 completed jobs. Great work! Would you like a detailed breakdown?";
      } else if (trimmedText.toLowerCase().includes("job") || trimmedText.toLowerCase().includes("work")) {
        replyText = "Here are the top 3 nearest and best jobs for your profile based on your requirements:\n\n" +
          "1. AC Repair in G-13 (Match Score: 98.5)\n" +
          "2. AC Servicing in F-8 (Match Score: 92.0)\n" +
          "3. Refrigerator Repair in I-8 (Match Score: 88.5)\n\nLet me show them to you.";
      }

      const newAgentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: replyText,
        sender: "agent",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newAgentMsg]);
      setIsTyping(false);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Navigate to jobs list if relevant
      if (replyText.includes("Here are the top 3")) {
        setTimeout(() => {
          router.push("/(provider)/jobs");
        }, 2500);
      }
    }, 1500);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === "user";
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.agentBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.agentText]}>
          {item.text}
        </Text>
        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.agentTimestamp]}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.onSurface} />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Mahir Agent</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Online</Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          {isTyping && (
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>Agent is typing...</Text>
            </View>
          )}

          <View style={styles.inputSection}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your message..."
              placeholderTextColor={Colors.onSurfaceVariant}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              textAlignVertical="center"
            />
            <Pressable
              style={[styles.sendButton, inputText.trim().length === 0 && styles.sendButtonDisabled]}
              onPress={() => handleSend()}
              disabled={inputText.trim().length === 0 || isTyping}
            >
              {isTyping ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Send size={20} color="#FFF" />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant + "4D",
    backgroundColor: Colors.surface,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
  },
  statusText: {
    ...Typography.bodySm,
    color: Colors.secondary,
    fontSize: 12,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.primaryContainer,
    borderBottomRightRadius: 4,
  },
  agentBubble: {
    alignSelf: "flex-start",
    backgroundColor: Colors.surfaceContainerHighest,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...Typography.bodyMd,
  },
  userText: {
    color: Colors.onPrimaryContainer,
  },
  agentText: {
    color: Colors.onSurface,
  },
  timestamp: {
    ...Typography.labelSm,
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  userTimestamp: {
    color: Colors.onPrimaryContainer + "99",
  },
  agentTimestamp: {
    color: Colors.onSurfaceVariant,
  },
  typingIndicator: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  typingText: {
    ...Typography.bodySm,
    color: Colors.secondary,
    fontStyle: "italic",
  },
  inputSection: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 32 : 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant + "4D",
    alignItems: "flex-end",
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "66",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    minHeight: 48,
    maxHeight: 120,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: Colors.primary + "66",
  },
});
