export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentType?: string;
  timestamp: Date;
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "user";
}
