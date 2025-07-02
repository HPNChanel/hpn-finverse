/**
 * ChatInterface component - Main AI Chat interface
 */

import React, { useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { ChatSidebar } from './ChatSidebar';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ isOpen, onClose }) => {
  const {
    sessions,
    currentSession,
    messages,
    isLoading,
    isTyping,
    error,
    suggestedPrompts,
    createSession,
    loadSession,
    updateSessionTitle,
    deleteSession,
    sendMessage,
    clearError
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleNewChat = async () => {
    try {
      await createSession();
    } catch (error) {
      console.error('❌ Error creating new chat:', error);
    }
  };

  const handleSelectSession = async (sessionId: number) => {
    try {
      await loadSession(sessionId);
    } catch (error) {
      console.error('❌ Error loading session:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content, currentSession?.id);
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // Could add a toast notification here
  };

  const handleMessageFeedback = (messageId: number, isPositive: boolean) => {
    // Could implement feedback tracking here
    console.log(`Message ${messageId} feedback: ${isPositive ? 'positive' : 'negative'}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-full max-w-5xl bg-white dark:bg-gray-800 shadow-2xl">
        <div className="flex h-full">
          {/* Sidebar */}
          <ChatSidebar
            sessions={sessions}
            currentSessionId={currentSession?.id || null}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            onRenameSession={updateSessionTitle}
            onDeleteSession={deleteSession}
            isLoading={isLoading}
          />

          {/* Main Chat Area */}
          <div className="flex flex-1 flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-white">AI</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    FinVerse AI Assistant
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentSession?.title || 'Your personal financial advisor'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{error}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearError}
                      className="h-6 px-2 text-xs"
                    >
                      Dismiss
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Welcome to FinVerse AI!
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    Your personal financial assistant is ready to help with budgeting, investments, DeFi, and more.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Start a conversation or use one of the suggested prompts below.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onCopy={handleCopyMessage}
                      onFeedback={handleMessageFeedback}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <ChatInput
              onSendMessage={handleSendMessage}
              isTyping={isTyping}
              isDisabled={false}
              suggestedPrompts={messages.length === 0 ? suggestedPrompts : []}
              placeholder="Ask me anything about your finances..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 