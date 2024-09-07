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
          @show-drawer="isDrawerOpen = true"
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
import type {ChatMessage, LlmParams, LoadingType, Participant} from '~~/types';
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
const chatHistory = ref<ChatMessage[]>([]);
const modChatHistory = ref<ChatMessage[]>([]);
const chatParticipants = ref<Participant[]>([]);
const loading = ref<LoadingType>('idle');

const resetSettings = () => {
  Object.assign(llmParams, defaultSettings);
};

const addParticipant = async (newParticipant: Participant) => {
  console.log('index:addParticipant', newParticipant)

  await sendMessageToParticipant(
      [modInitMessage, newParticipant.llmParams.systemPrompt].join(' '),
      true,
      modSettings
  )
  newParticipant.role = modChatHistory.value.at(-1).content

  chatParticipants.value.push(newParticipant);
};

const {getResponse, streamResponse} = useChat();

async function sendMessageToParticipant(message: string, isMod: boolean = false, thisLlmParams?: LlmParams) {
  thisLlmParams = thisLlmParams ?? llmParams;
  const history = isMod ? modChatHistory : chatHistory;
  history.value.push({role: 'user', content: message});

  try {
    if (thisLlmParams.stream) {
      loading.value = 'stream';
      const messageGenerator = streamResponse(
          thisLlmParams.model.startsWith('@openai') ? '/api/openai' : '/api/nuxthub',
          history.value,
          thisLlmParams
      );

      let responseAdded = false;
      for await (const chunk of messageGenerator) {
        if (responseAdded) {
          // add the response to the current message
          history.value[history.value.length - 1]!.content += chunk;
        } else {
          // add a new message to the chat history
          history.value.push({
            role: 'assistant',
            content: chunk,
          });

          responseAdded = true;
        }
      }
    } else {
      loading.value = 'message';
      const response = await getResponse(
          thisLlmParams.model.startsWith('@openai') ? '/api/openai' : '/api/nuxthub',
          history.value,
          thisLlmParams
      );

      history.value.push({role: 'assistant', content: response});
    }
  } catch (error) {
    console.error('Error sending message:', error);
  } finally {
    loading.value = 'idle';
  }

}

</script>
