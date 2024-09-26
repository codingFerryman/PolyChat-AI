<template>
  <div class="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
    <ChatHeader
        :clear-disabled="chatHistory.length === 0"
        @clear-history="$emit('clearHistory')"
    />
    <UDivider />
    <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-5">
      <div
          v-for="(message, index) in chatHistory"
          :key="`message-${index}`"
          class="flex items-start gap-x-4"
      >
        <UIcon v-if="message.participant" class="w-8 h-8 p-2 rounded-full" :name="`${message.participant.icon}`" :style="`color:${message.participant.iconColor}`"/>
        <AssistantMessage v-if="message.participant" :namecard="message.participant.llmParams.model + ' (' + message.participant.role + ')'" :content="message.content" />
      </div>
      <ChatLoadingSkeleton v-if="loading === 'message'" />
      <NoChats v-if="chatHistory.length === 0" class="h-full" />
    </div>
    <UDivider />
    <div class="flex items-start p-3.5 relative">
      <UButton
          v-if="chatHistory.length === 0"
          :disabled="loading !== 'idle'"
          label="Initiate Chat"
          @click="initiateChat"
      />
      <UButton
          v-else
          :disabled="loading !== 'idle'"
          label="Continue"
          @click="initiateChat"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type {ParticipantChatMessage, LoadingType} from '~~/types';

defineProps<{
  chatHistory: ParticipantChatMessage[];
  loading: LoadingType;
}>();


const emit = defineEmits<{
  initChat: [];
  clearHistory: [];
}>();

const chatContainer = ref<HTMLElement | null>(null);
let observer: MutationObserver | null = null;

onMounted(() => {
  if (chatContainer.value) {
    observer = new MutationObserver(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
      }
    });

    observer.observe(chatContainer.value, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});


const initiateChat = () => {
  // const initMessage: string = "Start!";
  emit('initChat');

};

</script>
