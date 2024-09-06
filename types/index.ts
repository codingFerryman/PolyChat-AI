export type LlmParams = {
  model: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt: string;
  stream: boolean;
  // participantId: string;
};

export type ChatMessage = {
  role: string;
  content: string;
};

export type Participant = {
  icon?: string;
  iconColor?: string;
  id: string;
  llmParams: LlmParams;
}

export type LoadingType = 'idle' | 'stream' | 'message';
