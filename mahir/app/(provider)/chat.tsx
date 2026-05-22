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
import { ArrowLeft, Send, Briefcase, MapPin, Star } from "lucide-react-native";
import { Colors, Typography, Radii } from "@/constants/design-tokens";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/services/api";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface JobData {
  id: string;
  title: string;
  location: string;
  score: number;
  price: string;
}

interface ChatMessage {
  id: string;
  type?: "text" | "job_list";
  text?: string;
  jobs?: JobData[];
  sender: "user" | "agent";
  timestamp: Date;
}

// ─── Rich Job Card Component ─────────────────────────────────────────────────

const RichJobCard = ({ job }: { job: JobData }) => {
  const router = useRouter();
  
  return (
    <View style={styles.jobCard}>
      <View style={styles.jobCardHeader}>
        <View style={styles.jobIconWrap}>
          <Briefcase size={16} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {job.title}
          </Text>
          <View style={styles.jobLocRow}>
            <MapPin size={10} color={Colors.secondary} />
            <Text style={styles.jobLocText} numberOfLines={1}>
              {job.location}
            </Text>
          </View>
        </View>
        <View style={styles.scoreBadge}>
          <Star size={10} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.scoreText}>{job.score}</Text>
        </View>
      </View>
      <View style={styles.jobCardDivider} />
      <View style={styles.jobCardFooter}>
        <View>
          <Text style={styles.jobPriceLabel}>Est. Budget</Text>
          <Text style={styles.jobPrice}>{job.price}</Text>
        </View>
        <Pressable 
          style={styles.acceptBtn} 
          onPress={() => router.push("/(provider)/jobs")}
        >
          <Text style={styles.acceptBtnText}>Accept Job</Text>
        </Pressable>
      </View>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

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
      type: "text",
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
      type: "text",
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
      const checkingMsg: ChatMessage = {
        id: Date.now().toString(),
        type: "text",
        text: "I'm checking that for you now...",
        sender: "agent",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, checkingMsg]);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100
      );

      setTimeout(async () => {
        let newAgentMsg: ChatMessage;

        try {
          // 1. Call AI Agent
          const agentRes = await apiClient.post("/api/provider/chat", { message: trimmedText });
          const { replyText, action, requestedCategory } = agentRes.data?.data || {};

          // Fallback if AI response is malformed
          if (!replyText) throw new Error("Invalid AI response");

          // 2. Handle Action: Fetch Earnings
          if (action === "fetch_earnings") {
            let earningsText = replyText;
            try {
              const earningsRes = await apiClient.get("/api/provider/earnings");
              const net = earningsRes.data?.data?.netEarningsPKR || 0;
              const completed = earningsRes.data?.data?.totalJobsCompleted || 0;
              earningsText += `\n\n(Rs ${net} earned from ${completed} jobs)`;
            } catch (e) {
              console.log("Failed to fetch earnings data");
            }
            newAgentMsg = {
              id: (Date.now() + 1).toString(),
              type: "text",
              text: earningsText,
              sender: "agent",
              timestamp: new Date(),
            };
          } 
          // 3. Handle Action: Fetch Jobs
          else if (action === "fetch_jobs") {
            try {
              const profileRes = await apiClient.get("/api/provider/profile");
              const profileCategory = profileRes.data?.data?.serviceCategory || "";
              
              const searchCategory = requestedCategory || profileCategory;
              
              const jobsRes = await apiClient.get(`/api/provider/jobs?lat=33.6844&lng=72.9774&radiusKm=50&limit=3&category=${encodeURIComponent(searchCategory)}`);
              
              // Filter out "Other" jobs if they explicitly requested a specific category
              let liveJobs = jobsRes.data?.data || [];
              if (requestedCategory && requestedCategory.toLowerCase() !== "other") {
                liveJobs = liveJobs.filter((j: any) => j.category && j.category.toLowerCase() !== "other");
              }

              if (liveJobs.length > 0) {
                const mappedJobs = liveJobs.map((j: any, i: number) => ({
                  id: j._id || `j${i}`,
                  title: j.title || j.category || "Available Job",
                  location: j.address || j.city || "Nearby",
                  score: Number((95 + Math.random() * 4).toFixed(1)),
                  price: `Rs. ${j.estimatedBudgetPKR || "Negotiable"}`,
                }));

                newAgentMsg = {
                  id: (Date.now() + 1).toString(),
                  type: "job_list",
                  text: replyText,
                  jobs: mappedJobs,
                  sender: "agent",
                  timestamp: new Date(),
                };
              } else {
                newAgentMsg = {
                  id: (Date.now() + 1).toString(),
                  type: "text",
                  text: `${replyText}\n\n(No open jobs found right now. I'll keep looking!)`,
                  sender: "agent",
                  timestamp: new Date(),
                };
              }
            } catch (e) {
              newAgentMsg = {
                id: (Date.now() + 1).toString(),
                type: "text",
                text: `${replyText}\n\n(Failed to fetch jobs from the portal)`,
                sender: "agent",
                timestamp: new Date(),
              };
            }
          } 
          // 4. Default / Conversational
          else {
            newAgentMsg = {
              id: (Date.now() + 1).toString(),
              type: "text",
              text: replyText,
              sender: "agent",
              timestamp: new Date(),
            };
          }
        } catch (error) {
          console.error("AI Agent Error:", error);
          newAgentMsg = {
            id: (Date.now() + 1).toString(),
            type: "text",
            text: "Sorry, my brain is offline right now. Please try again in a moment.",
            sender: "agent",
            timestamp: new Date(),
          };
        }

        setMessages((prev) => [...prev, newAgentMsg]);
        setIsTyping(false);
        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          100
        );
      }, 500);
    }, 500);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === "user";
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.agentBubble,
          item.type === "job_list" && { maxWidth: "90%" },
        ]}
      >
        {item.type === "job_list" && item.jobs ? (
          <View style={{ width: "100%" }}>
            <Text
              style={[
                styles.messageText,
                styles.agentText,
                { marginBottom: 12 },
              ]}
            >
              {item.text}
            </Text>
            <View style={{ gap: 8 }}>
              {item.jobs.map((job) => (
                <RichJobCard key={job.id} job={job} />
              ))}
            </View>
          </View>
        ) : (
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userText : styles.agentText,
            ]}
          >
            {item.text}
          </Text>
        )}
        <Text
          style={[
            styles.timestamp,
            isUser ? styles.userTimestamp : styles.agentTimestamp,
            item.type === "job_list" && { marginTop: 8 },
          ]}
        >
          {item.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
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
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 110 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
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
            style={[
              styles.sendButton,
              inputText.trim().length === 0 && styles.sendButtonDisabled,
            ]}
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
  // ─── Job Card Styles ──────────────────────────────────────────
  jobCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + "4D",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  jobCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  jobIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  jobTitle: {
    ...Typography.labelMd,
    fontFamily: "Sora_600SemiBold",
    color: Colors.onSurface,
    marginBottom: 2,
  },
  jobLocRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  jobLocText: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.secondary,
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  scoreText: {
    ...Typography.labelSm,
    fontSize: 10,
    color: "#92400E",
    fontFamily: "Sora_700Bold",
  },
  jobCardDivider: {
    height: 1,
    backgroundColor: Colors.outlineVariant + "33",
    marginVertical: 10,
  },
  jobCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jobPriceLabel: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.secondary,
  },
  jobPrice: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    fontFamily: "Sora_600SemiBold",
  },
  acceptBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acceptBtnText: {
    ...Typography.labelSm,
    color: Colors.onPrimary,
    fontFamily: "Sora_600SemiBold",
  },
});
