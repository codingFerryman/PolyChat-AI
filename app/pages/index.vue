<template>
  <div class="h-dvh flex flex-col md:flex-row">
    <!--    <USlideover-->
    <!--      v-model="isDrawerOpen"-->
    <!--      class="md:hidden"-->
    <!--      :ui="{ width: 'max-w-xs' }"-->
    <!--    >-->
    <!--      <LlmSettings-->
    <!--        v-model:llmParams="llmParams"-->
    <!--        @hide-drawer="isDrawerOpen = false"-->
    <!--        @reset="resetSettings"-->
    <!--        @add-participants="addParticipant"-->
    <!--      />-->
    <!--    </USlideover>-->
    <div class="hidden md:block md:w-1/3 lg:w-1/4">
      <LlmSettings
          v-model:llm-params="llmParams"
          @reset="resetSettings"
          @add-participant="addParticipant"
      />
    </div>

    <UDivider class="hidden md:block" orientation="vertical"/>

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

    <div class="h-dvh md:block md:w-1/3 lg:w-1/4">
      <ChatParticipants
          :chat-participants="chatParticipants"
          @clear-participants="chatParticipants = []"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import {reactive, ref} from 'vue';
import type {ParticipantChatMessage, ChatMessage, LlmParams, LoadingType, Participant} from '~~/types';
import {useChat} from '~~/app/composables/useChat';

const isDrawerOpen = ref(false);

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
}

const modInitMessage: string = "Please make the role-play card which summarizes the role of a participant. The card should be concise and has no more than 3 words. Please only return the content of the card. The role-play to summarize:"

const llmParams = reactive<LlmParams>({...defaultSettings});
const chatHistory = ref<ParticipantChatMessage[]>([]);
// const participantHistory = ref<Participant[]>([]);
// const modChatHistory = ref<ParticipantChatMessage[]>([]);
const chatParticipants = ref<Participant[]>([]);
const loading = ref<LoadingType>('idle');

const resetSettings = () => {
  Object.assign(llmParams, defaultSettings);
};

const clearHistory = () => {
  chatHistory.value = [];
}

const addParticipant = async (newParticipant: Participant) => {
  newParticipant.role = await sendMessageToParticipant(
      [modInitMessage, newParticipant.llmParams.systemPrompt].join(' '),
      true,
      newParticipant,
      modSettings
  )

  chatParticipants.value.push(newParticipant);
};

const {getResponse} = useChat();

let count = 0;
async function initChat() {
  if (chatParticipants.value.length === 0) {
    return;
  }
  // await sendMessageToParticipant("", false, participant, participant.llmParams);
  // while (count < 2) {
  const index = count % chatParticipants.value.length;

  const response = await sendMessageToParticipant("", false, chatParticipants.value[index], chatParticipants.value[index].llmParams);
  chatHistory.value.push({
    participant: chatParticipants.value[index],
    role: 'assistant',
    content: response
  });
  count++;
  // }
}

async function sendMessageToParticipant(message: string, isMod: boolean = false, participant: Participant, thisLlmParams: LlmParams) {
  try {
    loading.value = 'message';
    const processedHistory = processHistory(chatHistory.value, message, participant, isMod);
    return await getResponse(
        '/api/cloudflareAiGateway',
        processedHistory,
        thisLlmParams
    );
  } catch (error) {
    console.error('Error sending message:', error);
  } finally {
    loading.value = 'idle';
  }

}

function processHistory(history: ParticipantChatMessage[], newMessage: string, participant: Participant, isMod: boolean) {
  const tempHistory = ref<ChatMessage[]>([]);
  if (isMod) {  // TODO: check if this leads to duplicated system prompts
    tempHistory.value.push({role: 'system', content: modSettings.systemPrompt});
  } else {
    tempHistory.value.push({role: 'system', content: participant.llmParams.systemPrompt});
  }
  history.forEach((message) => {
    if (message.participant === participant) {
      tempHistory.value.push({role: 'assistant', content: '*' + message.participant.role + '*: ' + message.content});
    } else {
      tempHistory.value.push({role: 'user', content: '*' + message.participant.role + '*: ' + message.content});
    }
  });
  if (newMessage.length > 0) {
    tempHistory.value.push({role: 'user', content: '*' + participant.role + '*: ' + newMessage});
  }

  return tempHistory.value;
}

</script>
