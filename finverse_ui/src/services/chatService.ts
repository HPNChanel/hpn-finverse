/**
 * Chat service for AI Chat Assistant
 * Uses Axios for HTTP requests following FinVerse patterns
 */

import { apiClient } from '../lib/axios';
import {
  ChatSession,
  ChatSessionListItem,
  SendMessageRequest,
  SendMessageResponse,
  CreateSessionRequest,
  UpdateSessionRequest,
  SuggestedPrompt,
  ChatConfig,
  ApiResponse
} from '../types/chat';

class ChatService {
  private readonly baseUrl = '/chat';

  /**
   * Get all chat sessions for the current user
   */
  async getSessions(limit = 50): Promise<ChatSessionListItem[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ sessions: ChatSessionListItem[] }>>(
        `${this.baseUrl}/sessions?limit=${limit}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get chat sessions');
      }

      return response.data.data.sessions;
    } catch (error: unknown) {
      console.error('❌ Error getting chat sessions:', error);
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(err.response?.data?.detail || err.message || 'Failed to get chat sessions');
    }
  }

  /**
   * Get a specific chat session with messages
   */
  async getSession(sessionId: number): Promise<ChatSession> {
    try {
      const response = await apiClient.get<ApiResponse<{ session: ChatSession }>>(
        `${this.baseUrl}/sessions/${sessionId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get chat session');
      }

      return response.data.data.session;
    } catch (error: unknown) {
      console.error(`❌ Error getting chat session ${sessionId}:`, error);
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(err.response?.data?.detail || err.message || 'Failed to get chat session');
    }
  }

  /**
   * Create a new chat session
   */
  async createSession(data: CreateSessionRequest = {}): Promise<ChatSession> {
    try {
      const response = await apiClient.post<ApiResponse<{ session: ChatSession }>>(
        `${this.baseUrl}/sessions`,
        {
          title: data.title || 'New Chat'
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create chat session');
      }

      return response.data.data.session;
    } catch (error: unknown) {
      console.error('❌ Error creating chat session:', error);
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(err.response?.data?.detail || err.message || 'Failed to create chat session');
    }
  }

  /**
   * Update a chat session title
   */
  async updateSession(sessionId: number, data: UpdateSessionRequest): Promise<ChatSession> {
    try {
      const response = await apiClient.patch<ApiResponse<{ session: ChatSession }>>(
        `${this.baseUrl}/sessions/${sessionId}`,
        data
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update chat session');
      }

      return response.data.data.session;
    } catch (error: unknown) {
      console.error(`❌ Error updating chat session ${sessionId}:`, error);
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(err.response?.data?.detail || err.message || 'Failed to update chat session');
    }
  }

  /**
   * Delete a chat session
   */
  async deleteSession(sessionId: number): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<Record<string, never>>>(
        `${this.baseUrl}/sessions/${sessionId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete chat session');
      }
    } catch (error: unknown) {
      console.error(`❌ Error deleting chat session ${sessionId}:`, error);
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(err.response?.data?.detail || err.message || 'Failed to delete chat session');
    }
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(
    message: SendMessageRequest,
    config?: Partial<ChatConfig>
  ): Promise<SendMessageResponse> {
    try {
      // Prepare headers with optional OpenAI config
      const headers: Record<string, string> = {};

      // Only send headers if config is provided (for user-provided API keys)
      if (config?.openai_api_key) {
        headers['X-OpenAI-API-Key'] = config.openai_api_key;
      }

      if (config?.model) {
        headers['X-Model'] = config.model;
      }

      if (config?.temperature !== undefined) {
        headers['X-Temperature'] = config.temperature.toString();
      }

      if (config?.max_tokens) {
        headers['X-Max-Tokens'] = config.max_tokens.toString();
      }

      const response = await apiClient.post<ApiResponse<{ chat: SendMessageResponse }>>(
        `${this.baseUrl}/messages`,
        message,
        { headers }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to send message');
      }

      return response.data.data.chat;
    } catch (error: unknown) {
      console.error('❌ Error sending message:', error);
      const err = error as { response?: { status?: number; data?: { detail?: string } }; message?: string };
      
      // Handle specific OpenAI errors
      if (err.response?.status === 401) {
        throw new Error('OpenAI API key not configured. Please contact administrator.');
      } else if (err.response?.status === 402) {
        throw new Error('OpenAI API quota exceeded. Please contact administrator.');
      } else if (err.response?.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      }
      
      throw new Error(err.response?.data?.detail || err.message || 'Failed to send message');
    }
  }

  /**
   * Get suggested prompts
   */
  async getSuggestedPrompts(): Promise<SuggestedPrompt[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ prompts: { prompts: SuggestedPrompt[] } }>>(
        `${this.baseUrl}/prompts`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get suggested prompts');
      }

      return response.data.data.prompts.prompts;
    } catch (error: unknown) {
      console.error('❌ Error getting suggested prompts:', error);
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(err.response?.data?.detail || err.message || 'Failed to get suggested prompts');
    }
  }

  /**
   * Check chat service health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<{ status: string }>>(
        `${this.baseUrl}/health`
      );
      return response.data.success && response.data.data.status === 'healthy';
    } catch (error) {
      console.error('❌ Chat service health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService; 