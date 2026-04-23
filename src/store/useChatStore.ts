import { create } from "zustand";
import type { ChatMessage } from "@/types";

function genId() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

interface ChatState {
  messages: ChatMessage[];
  sendLoading: boolean;
  setSendLoading: (v: boolean) => void;
  addMessage: (m: Omit<ChatMessage, "id" | "createdAt">) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  sendLoading: false,
  setSendLoading: (sendLoading) => set({ sendLoading }),
  addMessage: (m) => {
    const full: ChatMessage = {
      ...m,
      id: genId(),
      createdAt: Date.now(),
    };
    set({ messages: [...get().messages, full] });
  },
  // Oturum / sekmeyi bırkırken; sendLoading asılı kalmasın
  reset: () => set({ messages: [], sendLoading: false }),
}));
