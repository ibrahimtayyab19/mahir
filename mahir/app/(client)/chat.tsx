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
      text: `Hello ${userName}! I am your Mahir Agent. How can I help you today?`,
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

  const handleSend = async (text: string = inputText) => {
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

    try {
      const token = useAuthStore.getState().token;
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000";

      const response = await fetch(`${apiUrl}/api/agent/job-intake`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rawMessage: trimmedText,
          latitude: 33.6844, // Mock G-13 location for demo
          longitude: 72.9774,
        }),
      });

      if (response.status === 401) {
        await useAuthStore.getState().logout();
        router.replace("/(auth)/login");
        return;
      }

      const result = await response.json();

      let replyText = "I'm looking for an expert to help you with that...";
      
      if (result.success && result.data?.parsedIntent) {
        const matchesCount = result.data.matches?.length || 0;
        const serviceType = result.data.parsedIntent.serviceType;
        const area = result.data.parsedIntent.location.area;
        
        replyText = `Great! I've found ${matchesCount} ${serviceType} experts near ${area}. Let's get you connected.\n\nTop 3 Matches:\n`;
        
        if (result.data.matches && result.data.matches.length > 0) {
          result.data.matches.slice(0, 3).forEach((m: any, idx: number) => {
            replyText += `${idx + 1}. ${m.name} (AI Score: ${m.score.toFixed(1)})\n`;
          });
        }
        
        if (result.data.fallbackTriggered || matchesCount === 0) {
           replyText = result.data.fallback?.reason || "I couldn't find anyone nearby. Try again later.";
        }
      } else {
         replyText = result.message || "I ran into a problem processing your request.";
      }

      const newAgentMsg: ChatMessage = {
        id: Date.now().toString(),
        text: replyText,
        sender: "agent",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newAgentMsg]);
      
      // Auto-navigate to results to show the matches (skipping processing to avoid 400 error)
      if (result.success && result.data?.matches?.length > 0) {
        setTimeout(() => {
          router.push({
            pathname: "/(client)/results",
            params: {
              sessionId: result.data.sessionId,
              jobPostId: result.data.jobPostId,
              matchesJson: JSON.stringify(result.data.matches),
              parsedIntentJson: JSON.stringify(result.data.parsedIntent),
              fallbackJson: JSON.stringify(result.data.fallback),
              agentTracesJson: JSON.stringify(result.data.agentTraces),
            },
          });
        }, 3000);
      }
    } catch (err) {
      console.error("Chat API Error:", err);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        text: "I'm having trouble connecting to the network right now. Please try again.",
        sender: "agent",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
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
