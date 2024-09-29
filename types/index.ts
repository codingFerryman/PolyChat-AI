export type LlmParams = {
  model: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt?: string;
  stream: boolean;
};

export type ParticipantChatMessage = {
  participant?: Participant;
  role: string;
  content: string;
};

export type ChatMessage = {
  role: string;
  content: string;
};

export type Participant = {
  icon?: string;
  iconColor?: string;
  id: number;
  role?: string;
  llmParams: LlmParams;
}

export type LoadingType = 'idle' | 'stream' | 'message';
