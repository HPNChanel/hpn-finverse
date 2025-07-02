/**
 * ChatInput component for sending messages
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { SuggestedPrompt } from '../../types/chat';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isTyping: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  suggestedPrompts?: SuggestedPrompt[];
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isTyping,
  isDisabled = false,
  placeholder = "Type your message...",
  suggestedPrompts = []
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !isTyping && !isDisabled) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setMessage(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const canSend = message.trim() && !isTyping && !isDisabled;

  // Group suggested prompts by category
  const promptsByCategory = suggestedPrompts.reduce((acc, prompt) => {
    if (!acc[prompt.category]) {
      acc[prompt.category] = [];
    }
    acc[prompt.category].push(prompt);
    return acc;
  }, {} as Record<string, SuggestedPrompt[]>);

  const categoryColors: Record<string, string> = {
    spending: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    saving: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    defi: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    general: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Suggested Prompts */}
      {suggestedPrompts.length > 0 && message === '' && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Suggested prompts
          </h4>
          <div className="space-y-3">
            {Object.entries(promptsByCategory).map(([category, prompts]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={categoryColors[category] || categoryColors.general}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {prompts.map((prompt, index) => (
                    <Card
                      key={index}
                      className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-gray-200 dark:border-gray-600"
                      onClick={() => handleSuggestedPrompt(prompt.prompt)}
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {prompt.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {prompt.prompt}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isDisabled ? "Chat is disabled" : placeholder}
              disabled={isDisabled || isTyping}
              className="resize-none min-h-[44px] max-h-32 pr-12 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              rows={1}
            />
            
            {/* Send button inside textarea */}
            <Button
              type="submit"
              size="sm"
              disabled={!canSend}
              className="absolute right-2 bottom-2 h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600"
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>


        </form>

        {/* Typing indicator */}
        {isTyping && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span>FinVerse AI is typing...</span>
          </div>
        )}

        {/* Help text */}
        <div className="mt-2 text-xs text-gray-500 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}; 