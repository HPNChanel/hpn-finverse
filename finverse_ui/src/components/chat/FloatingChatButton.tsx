/**
 * FloatingChatButton - A floating action button for accessing the AI chat
 */

import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Bot } from 'lucide-react';
import { ChatInterface } from './ChatInterface';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';

interface FloatingChatButtonProps {
  className?: string;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ className = '' }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user } = useAuth();

  // Listen for custom event from navigation bar
  useEffect(() => {
    const handleOpenChat = () => {
      setIsChatOpen(true);
    };

    window.addEventListener('openAIChat', handleOpenChat);
    return () => {
      window.removeEventListener('openAIChat', handleOpenChat);
    };
  }, []);

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  // Only show for authenticated users
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
        <Button
          onClick={handleToggleChat}
          className={`
            w-14 h-14 rounded-full shadow-lg transition-all duration-300 
            ${isChatOpen 
              ? 'bg-red-500 hover:bg-red-600 rotate-180' 
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-110'
            }
            text-white border-0
          `}
          size="sm"
        >
          {isChatOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative">
              <MessageCircle className="w-6 h-6" />
              {/* AI indicator */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white">
                <Bot className="w-2 h-2 text-white" />
              </div>
            </div>
          )}
        </Button>

        {/* Tooltip */}
        {!isChatOpen && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Ask FinVerse AI
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>

      {/* Chat Interface */}
      <ChatInterface isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}; 