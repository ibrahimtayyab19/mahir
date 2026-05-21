/**
 * Strict TypeScript interfaces for the Mahir App.
 * Enforces Enterprise Production Directive (Zero `any` types).
 */

// ── State Types ──

export type UserRole = "client" | "provider";

// ── Dashboard Types ──

export interface DashboardMetric {
  id: string;
  icon: string;       // Name of the Lucide icon to render
  title: string;      // Headline text (e.g., "Nearby Jobs")
  subtitle: string;   // Secondary text (e.g., "5 new in Rawalpindi")
  isUrgent?: boolean; // If true, colors use error tokens (Client specific)
}

// ── Component Props ──

export interface VoiceInputProps {
  onPress: () => void;
  statusText: string;
  isProcessing?: boolean;
}

export interface InfoCardProps {
  metric: DashboardMetric;
  onPress?: (id: string) => void;
}

export interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
}

export interface LoadingSkeletonProps {
  type: "dashboard" | "list";
}

// ── Jobs Feed Types ──

export interface JobListing {
  id: string;
  title: string;
  location: string;
  estimatedPrice: string;
  aiSummary: string;
  generatedBy: string;
  timeAgo: string;
}

// ── Active Job Types ──

export type ChecklistStatus = "completed" | "active" | "pending";

export interface ChecklistStep {
  id: string;
  label: string;
  status: ChecklistStatus;
}

export interface ActiveJob {
  id: string;
  title: string;
  status: string;
  location: string;
  scheduledTime: string;
  checklist: ChecklistStep[];
}

// ── Messages Types ──

export interface MessageThread {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  isUnread: boolean;
}

// ── Provider Job Types ──

export interface ProviderJob {
  id: string;
  title: string;
  location: string;
  estimatedPrice: string;
  aiSummary: string;
  generatedBy: string;
  timeAgo: string;
  distance: string;
  clientRating: number;
}

export interface ProviderActiveJob {
  id: string;
  title: string;
  status: "accepted" | "en_route" | "in_progress" | "completed";
  location: string;
  scheduledTime: string;
  clientName: string;
  estimatedEarnings: string;
  checklist: ChecklistStep[];
}

// ── Profile Types ──

export interface ProfileMenuItem {
  id: string;
  icon: string;
  label: string;
  isDestructive?: boolean;
}
