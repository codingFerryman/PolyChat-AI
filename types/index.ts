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
  participantId: string;
};

export type ChatMessage = {
  role: string;
  content: string;
};

export type Participant = {
  // icon?: string;
  id: string;
  llmParams: LlmParams;
  // systemPrompt: string;
  //
  // constructor(id: string, model: string, systemPrompt: string) {
  //   this.id = id;
  //   this.model = model;
  //   this.systemPrompt = systemPrompt;
  // }
}

export type LoadingType = 'idle' | 'stream' | 'message';
