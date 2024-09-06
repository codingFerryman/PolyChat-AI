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
          v-model:llmParams="llmParams"
          @reset="resetSettings"
          @add-participant="addParticipant"
      />
    </div>

    <UDivider orientation="vertical" class="hidden md:block" />

    <div class="flex-grow md:w-2/3 lg:w-3/4">
      <ChatPanel
        :chat-history="chatHistory"
        :loading="loading"
        @show-drawer="isDrawerOpen = true"
      />
    </div>
    <UDivider orientation="vertical" class="hidden md:block" />

    <div class="h-dvh md:block md:w-1/3 lg:w-1/4">
      <ChatParticipants
          :chat-participants="chatParticipants"
          @clear-participants="chatParticipants = []"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import type {ChatMessage, LlmParams, LoadingType, Participant} from '~~/types';
import { useChat } from '~~/app/composables/useChat';

const isDrawerOpen = ref(false);

const defaultSettings: LlmParams = {
  model: '@cf/meta/llama-3.1-8b-instruct',
  temperature: 0.6,
  maxTokens: 512,
  systemPrompt: 'You are a helpful assistant.',
  stream: true,
  participantId: '1',
};

const llmParams = reactive<LlmParams>({ ...defaultSettings });
const chatHistory = ref<ChatMessage[]>([]);
const chatParticipants = ref<Participant[]>([]);
const loading = ref<LoadingType>('idle');

const resetSettings = () => {
  Object.assign(llmParams, defaultSettings);
};

const addParticipant = (newParticipant: Participant) => {
  console.log('index:addParticipant', newParticipant);
  chatParticipants.value.push(newParticipant);
};

const { getResponse, streamResponse } = useChat();


async function sendMessageFromParticipant(participant: Participant, message?: string) {
  // chatHistory.value.push({ role: participant.id, content: message }); //TODO

  try {
    if (llmParams.stream) {
      loading.value = 'stream';
      const messageGenerator = streamResponse('/api/chat', chatHistory.value, llmParams);

      let responseAdded = false;
      for await (const chunk of messageGenerator) {
        if (responseAdded) {
          chatHistory.value[chatHistory.value.length - 1]!.content += chunk;
        } else {
          chatHistory.value.push({ role: 'assistant', content: chunk });
          responseAdded = true;
        }
      }
    } else {
      loading.value = 'message';
      const response = await getResponse('/api/chat', chatHistory.value, llmParams);
      chatHistory.value.push({ role: 'assistant', content: response });
    }
  } catch (error) {
    console.error('Error sending message:', error);
  } finally {
    loading.value = 'idle';
  }
}

async function sendMessage(message: string) {
  chatHistory.value.push({ role: 'user', content: message });

  try {
    if (llmParams.stream) {
      loading.value = 'stream';
      const messageGenerator = streamResponse(
        '/api/chat',
        chatHistory.value,
        llmParams
      );

      let responseAdded = false;
      for await (const chunk of messageGenerator) {
        if (responseAdded) {
          // add the response to the current message
          chatHistory.value[chatHistory.value.length - 1]!.content += chunk;
        } else {
          // add a new message to the chat history
          chatHistory.value.push({
            role: 'assistant',
            content: chunk,
          });

          responseAdded = true;
        }
      }
    } else {
      loading.value = 'message';
      const response = await getResponse(
        '/api/chat',
        chatHistory.value,
        llmParams
      );

      chatHistory.value.push({ role: 'assistant', content: response });
    }
  } catch (error) {
    console.error('Error sending message:', error);
  } finally {
    loading.value = 'idle';
  }
}
</script>
