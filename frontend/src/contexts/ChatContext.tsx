import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { ChatUser } from "@/types";

interface ChatContextValue {
  openChat: (targetUser: ChatUser) => void;
  openChatInbox: () => void;
  closeChat: () => void;
}

interface ChatState {
  chatOpen: boolean;
  chatTargetUser: ChatUser | undefined;
}

const ChatContext = createContext<ChatContextValue | null>(null);
const ChatStateContext = createContext<ChatState | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTargetUser, setChatTargetUser] = useState<ChatUser | undefined>();

  const openChat = useCallback((targetUser: ChatUser) => {
    setChatTargetUser(targetUser);
    setChatOpen(true);
  }, []);

  const openChatInbox = useCallback(() => {
    setChatTargetUser(undefined);
    setChatOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setChatOpen(false);
    setChatTargetUser(undefined);
  }, []);

  return (
    <ChatContext.Provider value={{ openChat, openChatInbox, closeChat }}>
      <ChatStateContext.Provider value={{ chatOpen, chatTargetUser }}>
        {children}
      </ChatStateContext.Provider>
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}

export function useChatState() {
  const ctx = useContext(ChatStateContext);
  if (!ctx) throw new Error("useChatState must be used within ChatProvider");
  return ctx;
}
