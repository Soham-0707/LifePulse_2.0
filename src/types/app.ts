export type WellnessStatus = "balanced" | "watch" | "needs-support";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export interface RoutineEntry {
  id: string;
  userId: string;
  date: string;
  mood: number;
  stress: number;
  sleepHours: number;
  energy: number;
  social: number;
  activities: string[];
  journal: string;
  createdAt: string;
}

export interface PlaylistRecommendation {
  title: string;
  url: string;
  mood: string;
}

export interface AnalysisResult {
  status: WellnessStatus;
  riskScore: number;
  confidence: number;
  reasons: string[];
  actions: string[];
  playlist: PlaylistRecommendation;
  generatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AiSettings {
  apiKey: string;
  model: string;
  baseUrl: string;
}
