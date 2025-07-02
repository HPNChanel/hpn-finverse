/**
 * Chat hook for AI Chat Assistant
 * Manages chat state, sessions, and message operations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '../services/chatService';
import {
  ChatSession,
  ChatSessionListItem,
  ChatMessage,
  SendMessageRequest,
  ChatConfig,
  ChatState,
  SuggestedPrompt
} from '../types/chat';

interface UseChatOptions {
  autoLoadSessions?: boolean;
  maxSessions?: number;
}

interface UseChatReturn {
  // State
  sessions: ChatSessionListItem[];
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  suggestedPrompts: SuggestedPrompt[];
  
  // Session management
  loadSessions: () => Promise<void>;
  createSession: (title?: string) => Promise<ChatSession>;
  loadSession: (sessionId: number) => Promise<void>;
  updateSessionTitle: (sessionId: number, title: string) => Promise<void>;
  deleteSession: (sessionId: number) => Promise<void>;
  
  // Message management
  sendMessage: (content: string, sessionId?: number, config?: Partial<ChatConfig>) => Promise<void>;
  clearError: () => void;
  
  // Utilities
  loadSuggestedPrompts: () => Promise<void>;
}

export const useChat = (options: UseChatOptions = {}): UseChatReturn => {
  const { autoLoadSessions = true, maxSessions = 50 } = options;
  
  // State management
  const [state, setState] = useState<ChatState>({
    sessions: [],
    currentSession: null,
    messages: [],
    isLoading: false,
    isTyping: false,
    error: null,
    suggestedPrompts: []
  });

  // Refs for preventing race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Helper function to safely update state
  const safeSetState = useCallback((updater: Partial<ChatState> | ((prev: ChatState) => Partial<ChatState>)) => {
    if (!mountedRef.current) return;
    
    setState(prev => {
      const update = typeof updater === 'function' ? updater(prev) : updater;
      return { ...prev, ...update };
    });
  }, []);

  // Load chat sessions
  const loadSessions = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      safeSetState({ isLoading: true, error: null });
      
      const sessions = await chatService.getSessions(maxSessions);
      
      if (mountedRef.current) {
        safeSetState({ 
          sessions, 
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('❌ Error loading chat sessions:', error);
      if (mountedRef.current) {
        safeSetState({ 
          error: error instanceof Error ? error.message : 'Failed to load chat sessions',
          isLoading: false 
        });
      }
    }
  }, [maxSessions, safeSetState]);

  // Create new session
  const createSession = useCallback(async (title?: string): Promise<ChatSession> => {
    try {
      safeSetState({ isLoading: true, error: null });
      
      const session = await chatService.createSession({ title });
      
      if (mountedRef.current) {
        safeSetState(prev => ({
          sessions: [
            {
              id: session.id,
              title: session.title,
              user_id: session.user_id,
              created_at: session.created_at,
              updated_at: session.updated_at,
              message_count: 0
            },
            ...prev.sessions
          ],
          currentSession: session,
          messages: session.messages || [],
          isLoading: false
        }));
      }
      
      return session;
    } catch (error) {
      console.error('❌ Error creating chat session:', error);
      if (mountedRef.current) {
        safeSetState({ 
          error: error instanceof Error ? error.message : 'Failed to create chat session',
          isLoading: false 
        });
      }
      throw error;
    }
  }, [safeSetState]);

  // Load specific session
  const loadSession = useCallback(async (sessionId: number) => {
    if (!mountedRef.current) return;
    
    try {
      safeSetState({ isLoading: true, error: null });
      
      const session = await chatService.getSession(sessionId);
      
      if (mountedRef.current) {
        safeSetState({
          currentSession: session,
          messages: session.messages || [],
          isLoading: false
        });
      }
    } catch (error) {
      console.error('❌ Error loading chat session:', error);
      if (mountedRef.current) {
        safeSetState({ 
          error: error instanceof Error ? error.message : 'Failed to load chat session',
          isLoading: false 
        });
      }
    }
  }, [safeSetState]);

  // Update session title
  const updateSessionTitle = useCallback(async (sessionId: number, title: string) => {
    try {
      safeSetState({ error: null });
      
      const updatedSession = await chatService.updateSession(sessionId, { title });
      
      if (mountedRef.current) {
        safeSetState(prev => ({
          sessions: prev.sessions.map(session =>
            session.id === sessionId ? { ...session, title } : session
          ),
          currentSession: prev.currentSession?.id === sessionId ? updatedSession : prev.currentSession
        }));
      }
    } catch (error) {
      console.error('❌ Error updating session title:', error);
      if (mountedRef.current) {
        safeSetState({ 
          error: error instanceof Error ? error.message : 'Failed to update session title'
        });
      }
    }
  }, [safeSetState]);

  // Delete session
  const deleteSession = useCallback(async (sessionId: number) => {
    try {
      safeSetState({ error: null });
      
      await chatService.deleteSession(sessionId);
      
      if (mountedRef.current) {
        safeSetState(prev => ({
          sessions: prev.sessions.filter(session => session.id !== sessionId),
          currentSession: prev.currentSession?.id === sessionId ? null : prev.currentSession,
          messages: prev.currentSession?.id === sessionId ? [] : prev.messages
        }));
      }
    } catch (error) {
      console.error('❌ Error deleting session:', error);
      if (mountedRef.current) {
        safeSetState({ 
          error: error instanceof Error ? error.message : 'Failed to delete session'
        });
      }
    }
  }, [safeSetState]);

  // Send message
  const sendMessage = useCallback(async (
    content: string, 
    sessionId?: number,
    config?: Partial<ChatConfig>
  ) => {
    if (!mountedRef.current) return;
    
    try {
      safeSetState({ isTyping: true, error: null });
      
      const request: SendMessageRequest = {
        content,
        session_id: sessionId
      };
      
      const response = await chatService.sendMessage(request, config);
      
      if (mountedRef.current) {
        const updatedSession = response.session;
        
        safeSetState(prev => ({
          currentSession: updatedSession,
          messages: updatedSession.messages || [],
          sessions: sessionId 
            ? prev.sessions.map(session =>
                session.id === sessionId 
                  ? { ...session, updated_at: updatedSession.updated_at }
                  : session
              )
            : [
                {
                  id: updatedSession.id,
                  title: updatedSession.title,
                  user_id: updatedSession.user_id,
                  created_at: updatedSession.created_at,
                  updated_at: updatedSession.updated_at,
                  message_count: updatedSession.messages?.length || 0
                },
                ...prev.sessions
              ],
          isTyping: false
        }));
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      if (mountedRef.current) {
        safeSetState({ 
          error: error instanceof Error ? error.message : 'Failed to send message',
          isTyping: false 
        });
      }
    }
  }, [safeSetState]);

  // Load suggested prompts
  const loadSuggestedPrompts = useCallback(async () => {
    try {
      const prompts = await chatService.getSuggestedPrompts();
      
      if (mountedRef.current) {
        safeSetState({ suggestedPrompts: prompts });
      }
    } catch (error) {
      console.error('❌ Error loading suggested prompts:', error);
      // Don't set error state for suggested prompts as it's not critical
    }
  }, [safeSetState]);

  // Clear error
  const clearError = useCallback(() => {
    safeSetState({ error: null });
  }, [safeSetState]);

  // Auto-load sessions on mount
  useEffect(() => {
    if (autoLoadSessions) {
      loadSessions();
      loadSuggestedPrompts();
    }
  }, [autoLoadSessions, loadSessions, loadSuggestedPrompts]);

  return {
    // State
    sessions: state.sessions,
    currentSession: state.currentSession,
    messages: state.messages,
    isLoading: state.isLoading,
    isTyping: state.isTyping,
    error: state.error,
    suggestedPrompts: state.suggestedPrompts,
    
    // Actions
    loadSessions,
    createSession,
    loadSession,
    updateSessionTitle,
    deleteSession,
    sendMessage,
    clearError,
    loadSuggestedPrompts
  };
}; 