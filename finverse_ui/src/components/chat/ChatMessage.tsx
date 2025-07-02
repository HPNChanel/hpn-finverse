/**
 * ChatMessage component for displaying individual chat messages
 */

import React, { memo } from 'react';
// Using native Date formatting instead of date-fns
import { Copy, ThumbsUp, ThumbsDown, User, Bot } from 'lucide-react';
import { ChatMessage as ChatMessageType, ChatRole } from '../../types/chat';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface ChatMessageProps {
  message: ChatMessageType;
  onCopy?: (content: string) => void;
  onFeedback?: (messageId: number, isPositive: boolean) => void;
}

export const ChatMessage = memo(({ message, onCopy, onFeedback }: ChatMessageProps) => {
  const isUser = message.role === ChatRole.USER;
  const isAssistant = message.role === ChatRole.ASSISTANT;

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.content);
    } else {
      navigator.clipboard.writeText(message.content);
    }
  };

  const handleFeedback = (isPositive: boolean) => {
    if (onFeedback) {
      onFeedback(message.id, isPositive);
    }
  };

  // Format timestamp
  const timestamp = new Date(message.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-gradient-to-br from-purple-500 to-blue-600 text-white'
        }`}>
          {isUser ? (
            <User size={16} />
          ) : (
            <Bot size={16} />
          )}
        </div>

        {/* Message content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <Card className={`p-4 ${
            isUser 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {/* Simple text rendering - could be enhanced with markdown */}
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
            </div>
          </Card>

          {/* Message metadata and actions */}
          <div className={`flex items-center gap-2 mt-2 text-xs text-gray-500 ${
            isUser ? 'flex-row-reverse' : 'flex-row'
          }`}>
            <span>{timestamp}</span>
            
            {/* Token count for AI messages */}
            {isAssistant && message.token_count && (
              <>
                <span>•</span>
                <span>{message.token_count} tokens</span>
              </>
            )}

            {/* Model info for AI messages */}
            {isAssistant && message.model_used && (
              <>
                <span>•</span>
                <span>{message.model_used}</span>
              </>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 ml-2">
              {/* Copy button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Copy size={12} />
              </Button>

              {/* Feedback buttons for AI messages */}
              {isAssistant && onFeedback && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeedback(true)}
                    className="h-6 w-6 p-0 hover:bg-green-100 dark:hover:bg-green-900 text-green-600 hover:text-green-700"
                  >
                    <ThumbsUp size={12} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeedback(false)}
                    className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 hover:text-red-700"
                  >
                    <ThumbsDown size={12} />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage'; 