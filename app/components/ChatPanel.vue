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
        <UIcon
            v-if="message.participant"
            class="w-8 h-8 p-2 rounded-full"
            :name="`${message.participant.icon}`"
            :style="`color:${message.participant.iconColor}`"
        />
        <UIcon
            v-else
            class="w-8 h-8 p-2 rounded-full"
            name="i-heroicons-user"
        />
        <AssistantMessage
            v-if="message.participant"
            :namecard="message.participant.llmParams.model + ' (' + message.participant.role + ')'"
            :content="message.content"
        />
        <span
            v-else
            class="prose dark:prose-invert"
        >
          Human User ({{message.role}}) <br>
          {{message.content}}
        </span>
      </div>
      <ChatLoadingSkeleton v-if="loading === 'message'" />
      <NoChats v-if="chatHistory.length === 0" class="h-full" />
    </div>
    <UDivider />
    <div class="flex items-start p-3.5 relative">
      <USelectMenu
          v-model="userRoleLabels"
          clear-search-on-close
          by="id"
          name="userRoleLabels"
          :options="userRoleOptions"
          :ui="{ padding: { xl: 'pr-11' } }"
          option-attribute="name"
          autoresize
          searchable
          creatable
          size="xl"
          show-create-option-when="always"
          placeholder="Select a role"
      />
      <UTextarea
          v-model="userMessage"
          placeholder="Enter and send a message to join the chat. | Sending an empty message will continue the conversation."
          class="w-full"
          :ui="{ padding: { xl: 'pr-11' } }"
          :rows="1"
          :maxrows="5"
          :disabled="loading !== 'idle'"
          autoresize
          size="xl"
          @keydown.enter.exact.prevent="userMessage.trim() ? sendUserMessage() : initChat()"
          @keydown.enter.shift.exact.prevent="userMessage += '\n'"
      />
      <UButton
          :icon="userMessage.trim() ? 'i-heroicons-arrow-up-20-solid' : 'i-heroicons-play-20-solid'"
          class="absolute top-5 right-5"
          :disabled="loading !== 'idle'"
          @click="userMessage.trim() ? sendUserMessage() : initChat()"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { ParticipantChatMessage, LoadingType } from '~~/types';

// Define props
defineProps<{
  chatHistory: ParticipantChatMessage[];
  loading: LoadingType;
}>();

// Define emits
const emit = defineEmits<{
  initChat: [];
  sendUserMessage: [string, string]; // Accepts two string parameters
  clearHistory: [];
}>();

// Reactive references
const chatContainer = ref<HTMLElement | null>(null);
const userMessage = ref('');

// MutationObserver to handle scrolling
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

interface RoleOption {
  id: number;
  name: string;
}

const userRoleOptions = ref<RoleOption[]>([{ id: 1, name: 'Moderator' }]);
const userRoleSelected = ref<RoleOption>({ id: 1, name: 'Moderator' });

const userRoleLabels = computed<RoleOption>({
  get: () => userRoleSelected.value,
  set: async (label: RoleOption | string) => {
    if (typeof label === 'string') {
      const response: RoleOption = {
        id: userRoleOptions.value.length + 1,
        name: label,
      };
      userRoleOptions.value.push(response);
      userRoleSelected.value = response;
    } else {
      userRoleSelected.value = label;
    }
  },
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});

// Functions
const initChat = () => {
  emit('initChat');
};

const sendUserMessage = () => {
  emit('sendUserMessage', userMessage.value, userRoleLabels.value.name);
  userMessage.value = '';
};
</script>
