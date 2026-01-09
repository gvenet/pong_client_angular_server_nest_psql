// src/app/models/chat-message.model.ts
export interface ChatMessage {
  id: string;
  message: string;
  game_id: string | null;
  sentAt: string;
  user: {
    id: string;
    username: string;
  };
}

export interface ChatStats {
  totalMessages: number;
  globalMessages: number;
  gameMessages: number;
}
