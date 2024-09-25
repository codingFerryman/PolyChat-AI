<template>
  <div class="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
    <ChatHeader
        :clear-disabled="chatHistory.length === 0"
        @clear-history="$emit('clearHistory')"
        @show-drawer="$emit('showDrawer')"
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
<!--      <UButton-->
<!--          label="Clear History"-->
<!--          :disabled="chatHistory.length === 0 || loading !== 'idle'"-->
<!--          @click="$emit('clear')"-->
<!--      />-->
    </div>

      <!--    <div class="flex items-start p-3.5 relative">-->
<!--      <UTextarea-->
<!--          v-model="userMessage"-->
<!--          placeholder="How can I help you today?"-->
<!--          class="w-full"-->
<!--          :ui="{ padding: { xl: 'pr-11' } }"-->
<!--          :rows="1"-->
<!--          :maxrows="5"-->
<!--          :disabled="loading !== 'idle'"-->
<!--          autoresize-->
<!--          size="xl"-->
<!--          @keydown.enter.exact.prevent="sendMessage"-->
<!--          @keydown.enter.shift.exact.prevent="userMessage += '\n'"-->
<!--      />-->

<!--      <UButton-->
<!--          icon="i-heroicons-arrow-up-20-solid"-->
<!--          class="absolute top-5 right-5"-->
<!--          :disabled="loading !== 'idle'"-->
<!--          @click="sendMessage"-->
<!--      />-->
<!--    </div>-->
  </div>
<!--  <div ref="chatContainer">-->
<!--    <div v-for="message in chatHistory" :key="message.id">-->
<!--      <p>-->
<!--        <strong>{{ message.role }}</strong>: {{ message.content }}-->
<!--      </p>-->
<!--    </div>-->
<!--  </div>-->
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
  showDrawer: [];
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
