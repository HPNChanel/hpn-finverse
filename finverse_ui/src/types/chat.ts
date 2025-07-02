/**
 * Chat types for AI Chat Assistant
 */

export enum ChatRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface ChatMessage {
  id: number;
  session_id: number;
  role: ChatRole;
  content: string;
  created_at: string;
  token_count?: number;
  model_used?: string;
}

export interface ChatSession {
  id: number;
  title: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface ChatSessionListItem {
  id: number;
  title: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface SendMessageRequest {
  content: string;
  session_id?: number;
}

export interface SendMessageResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
  session: ChatSession;
}

export interface CreateSessionRequest {
  title?: string;
}

export interface UpdateSessionRequest {
  title: string;
}

export interface SuggestedPrompt {
  title: string;
  prompt: string;
  category: string;
}

export interface ChatConfig {
  openai_api_key: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatState {
  sessions: ChatSessionListItem[];
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  suggestedPrompts: SuggestedPrompt[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Array<{ detail: string }>;
} 