// mobile/src/contexts/ChatBotContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatBotContextType {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
}

const ChatBotContext = createContext<ChatBotContextType | undefined>(undefined);

export const ChatBotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);
  const toggleChat = () => setIsOpen((prev) => !prev);

  return (
    <ChatBotContext.Provider value={{ isOpen, openChat, closeChat, toggleChat }}>
      {children}
    </ChatBotContext.Provider>
  );
};

export const useChatBot = () => {
  const context = useContext(ChatBotContext);
  if (!context) {
    throw new Error('useChatBot must be used within ChatBotProvider');
  }
  return context;
};