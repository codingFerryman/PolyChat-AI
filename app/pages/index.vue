<template>
  <div class="h-dvh flex flex-col md:flex-row">
    <!-- Modal -->
    <div v-if="showLlmSettings" class="fixed inset-0 flex items-center justify-center z-50">
      <!-- Background overlay -->
      <div class="absolute inset-0 bg-black opacity-50" @click="showLlmSettings = false"/>
      <!-- Modal content -->
      <div class="bg-white dark:bg-gray-800 p-8 rounded shadow-lg z-10 w-11/12 md:w-5/6 lg:w-1/2 max-w-5xl">
        <LlmSettings
            v-model:llm-params="llmParams"
            @reset="resetSettings"
            @add-participant="addParticipant"
            @close="showLlmSettings = false"
        />
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-grow md:w-2/3 lg:w-3/4">
      <ChatPanel
          :chat-history="chatHistory"
          :loading="loading"
          @clear-history="clearHistory"
          @show-drawer="isDrawerOpen = true"
          @init-chat="initChat"
      />
    </div>

    <UDivider class="hidden md:block" orientation="vertical"/>

    <!-- Participants -->
    <div class="h-dvh md:block md:w-1/3 lg:w-1/4">
      <ChatParticipants
          :chat-participants="chatParticipants"
          @clear-participants="chatParticipants = []"
          @show-llm-settings="showLlmSettings = true"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import type { ParticipantChatMessage, ChatMessage, LlmParams, LoadingType, Participant } from '~~/types';
import { useChat } from '~~/app/composables/useChat';

const isDrawerOpen = ref(false);

const showLlmSettings = ref(false);

const defaultSettings: LlmParams = {
  model: '@cf/meta/llama-3.1-8b-instruct',
  temperature: 0.6,
  maxTokens: 512,
  systemPrompt: 'You are a helpful assistant.',
  stream: false,
};

const modSettings: LlmParams = {
  model: '@openai/gpt-4o-mini',
  temperature: 0.6,
  maxTokens: 512,
  systemPrompt: 'You are a moderator of a role-playing chat. The participants are LLM models.',
  stream: false,
};

const modInitMessage: string =
    'Please make the role-play card which summarizes the role of a participant. The card should be concise and has no more than 3 words. Please only return the content of the card. The role-play to summarize:';

const llmParams = reactive<LlmParams>({ ...defaultSettings });
const chatHistory = ref<ParticipantChatMessage[]>([]);
const chatParticipants = ref<Participant[]>([]);
const loading = ref<LoadingType>('idle');

const resetSettings = () => {
  Object.assign(llmParams, defaultSettings);
};

const clearHistory = () => {
  chatHistory.value = [];
};

const addParticipant = async (newParticipant: Participant) => {
  newParticipant.role = await sendMessageToParticipant(
      [modInitMessage, newParticipant.llmParams.systemPrompt].join(' '),
      true,
      newParticipant,
      modSettings
  );

  chatParticipants.value.push(newParticipant);

  // Hide the modal after adding the participant
  showLlmSettings.value = false;
};

const { getResponse } = useChat();

let count = 0;
async function initChat() {
  if (chatParticipants.value.length === 0) {
    return;
  }
  const index = count % chatParticipants.value.length;

  const response = await sendMessageToParticipant(
      '',
      false,
      chatParticipants.value[index],
      chatParticipants.value[index].llmParams
  );
  chatHistory.value.push({
    participant: chatParticipants.value[index],
    role: 'assistant',
    content: response,
  });
  count++;
}

async function sendMessageToParticipant(
    message: string,
    isMod: boolean = false,
    participant: Participant,
    thisLlmParams: LlmParams
) {
  try {
    loading.value = 'message';
    const processedHistory = processHistory(chatHistory.value, message, participant, isMod);
    return await getResponse('/api/cloudflareAiGateway', processedHistory, thisLlmParams);
  } catch (error) {
    console.error('Error sending message:', error);
  } finally {
    loading.value = 'idle';
  }
}

function processHistory(
    history: ParticipantChatMessage[],
    newMessage: string,
    participant: Participant,
    isMod: boolean
) {
  const tempHistory = ref<ChatMessage[]>([]);
  if (isMod) {
    tempHistory.value.push({ role: 'system', content: modSettings.systemPrompt });
  } else {
    tempHistory.value.push({ role: 'system', content: participant.llmParams.systemPrompt });
  }
  history.forEach((message) => {
    if (message.participant === participant) {
      tempHistory.value.push({
        role: 'assistant',
        content: '*' + message.participant.role + '*: ' + message.content,
      });
    } else {
      tempHistory.value.push({
        role: 'user',
        content: '*' + message.participant.role + '*: ' + message.content,
      });
    }
  });
  if (newMessage.length > 0) {
    tempHistory.value.push({ role: 'user', content: '*' + participant.role + '*: ' + newMessage });
  }

  return tempHistory.value;
}
</script>

<!--<style scoped>-->
<!--.modal-overlay {-->
<!--  /* Optional: Customize your modal overlay styles here */-->
<!--}-->

<!--.modal-container {-->
<!--  /* Optional: Customize your modal container styles here */-->
<!--}-->
<!--</style>-->
