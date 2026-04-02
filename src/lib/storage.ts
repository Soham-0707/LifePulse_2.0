import {
  AiSettings,
  AnalysisResult,
  ChatMessage,
  RoutineEntry,
  SessionUser,
  UserAccount,
} from "@/types/app";

const STORAGE_KEYS = {
  users: "lifepulse.users",
  session: "lifepulse.session",
  entries: "lifepulse.entries",
  analysis: "lifepulse.analysis",
  chat: "lifepulse.chat",
  aiSettings: "lifepulse.aiSettings",
};

const WELLNESS_UPDATED_EVENT = "lifepulse:updated";

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    if (!value) {
      return fallback;
    }
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function emitWellnessUpdate() {
  window.dispatchEvent(new CustomEvent(WELLNESS_UPDATED_EVENT));
}

export function onWellnessUpdate(callback: () => void) {
  const handler = () => callback();
  window.addEventListener(WELLNESS_UPDATED_EVENT, handler);
  return () => window.removeEventListener(WELLNESS_UPDATED_EVENT, handler);
}

export function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

export function getUsers() {
  return readJson<UserAccount[]>(STORAGE_KEYS.users, []);
}

export function saveUsers(users: UserAccount[]) {
  writeJson(STORAGE_KEYS.users, users);
}

export function getSessionUser() {
  return readJson<SessionUser | null>(STORAGE_KEYS.session, null);
}

export function saveSessionUser(user: SessionUser | null) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.session);
    return;
  }
  writeJson(STORAGE_KEYS.session, user);
}

export function getEntries() {
  return readJson<RoutineEntry[]>(STORAGE_KEYS.entries, []);
}

export function saveEntries(entries: RoutineEntry[]) {
  writeJson(STORAGE_KEYS.entries, entries);
  emitWellnessUpdate();
}

export function getEntriesForUser(userId: string) {
  return getEntries()
    .filter((entry) => entry.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function addEntry(entry: RoutineEntry) {
  const entries = getEntries();
  entries.push(entry);
  saveEntries(entries);
}

export function getAnalysisMap() {
  return readJson<Record<string, AnalysisResult>>(STORAGE_KEYS.analysis, {});
}

export function saveAnalysisForUser(userId: string, analysis: AnalysisResult) {
  const map = getAnalysisMap();
  map[userId] = analysis;
  writeJson(STORAGE_KEYS.analysis, map);
  emitWellnessUpdate();
}

export function getAnalysisForUser(userId: string) {
  const map = getAnalysisMap();
  return map[userId] ?? null;
}

export function getChatMessages(userId: string) {
  const all = readJson<Record<string, ChatMessage[]>>(STORAGE_KEYS.chat, {});
  return all[userId] ?? [];
}

export function saveChatMessages(userId: string, messages: ChatMessage[]) {
  const all = readJson<Record<string, ChatMessage[]>>(STORAGE_KEYS.chat, {});
  all[userId] = messages;
  writeJson(STORAGE_KEYS.chat, all);
}

export function getAiSettings() {
  const defaults: AiSettings = {
    apiKey: "",
    model: "gpt-4o-mini",
    baseUrl: "https://api.openai.com/v1",
  };
  return { ...defaults, ...readJson<Partial<AiSettings>>(STORAGE_KEYS.aiSettings, {}) };
}

export function saveAiSettings(settings: AiSettings) {
  writeJson(STORAGE_KEYS.aiSettings, settings);
}
