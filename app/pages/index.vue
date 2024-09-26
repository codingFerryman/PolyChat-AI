<template>
  <div class="h-screen flex" :style="componentStyles.container">
    <!-- Modal -->
    <div v-if="showLlmSettings" class="fixed inset-0 flex items-center justify-center z-50">
      <!-- Background overlay -->
      <div class="absolute inset-0 bg-black opacity-50" @click="showLlmSettings = false" />
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

    <!-- Main Container -->
    <div :style="componentStyles.chatPanel">
      <ChatPanel
          :chat-history="chatHistory"
          :loading="loading"
          @clear-history="clearHistory"
          @show-drawer="isDrawerOpen = true"
          @init-chat="initChat"
      />
    </div>

    <!-- Resizable Divider -->
    <div
        :style="componentStyles.divider"
        class="divider"
        @mousedown.prevent="startResize"
    >
      <div class="divider-icon">
        <UIcon :name="isLandscape ? 'i-mdi-drag-vertical-variant' : 'i-mdi-drag-horizontal-variant'" />
      </div>
    </div>

    <!-- Participants -->
    <div :style="componentStyles.chatParticipants">
      <ChatParticipants
          :chat-participants="chatParticipants"
          @clear-participants="chatParticipants = []"
          @show-llm-settings="showLlmSettings = true"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import type {
  ParticipantChatMessage,
  ChatMessage,
  LlmParams,
  LoadingType,
  Participant,
} from '~~/types';
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

// Resizable Logic
const chatPanelSize = ref(75); // Percentage
const chatParticipantsSize = ref(25); // Percentage

// Use useMediaQuery from @vueuse/core to detect orientation
const isLandscape = useMediaQuery('(orientation: landscape)');

// Computed styles for components
const componentStyles = computed(() => {
  const dividerBaseStyle = {
    backgroundColor: 'var(--divider-color, rgba(0, 0, 0, 0.1))', // Adjust the color as needed
    userSelect: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  if (isLandscape.value) {
    return {
      container: {
        flexDirection: 'row',
      },
      chatPanel: {
        flexBasis: chatPanelSize.value + '%',
        overflow: 'hidden',
      },
      chatParticipants: {
        flexBasis: chatParticipantsSize.value + '%',
        overflow: 'hidden',
      },
      divider: {
        ...dividerBaseStyle,
        width: '2px', // Thinner divider
        cursor: 'col-resize',
      },
    };
  } else {
    return {
      container: {
        flexDirection: 'column',
      },
      chatPanel: {
        flexBasis: chatPanelSize.value + '%',
        overflow: 'hidden',
      },
      chatParticipants: {
        flexBasis: chatParticipantsSize.value + '%',
        overflow: 'hidden',
      },
      divider: {
        ...dividerBaseStyle,
        height: '2px', // Thinner divider
        cursor: 'row-resize',
      },
    };
  }
});

// Resizing logic
const isResizing = ref(false);

const startResize = () => {
  isResizing.value = true;
  if (import.meta.client) {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', stopResize);
  }
};

const onMouseMove = (event) => {
  if (!isResizing.value) return;

  if (isLandscape.value) {
    const deltaX = event.movementX;
    const totalWidth = document.body.clientWidth;
    const deltaPercent = (deltaX / totalWidth) * 100;

    let newChatPanelSize = chatPanelSize.value + deltaPercent;
    newChatPanelSize = Math.min(Math.max(newChatPanelSize, 10), 90); // Clamp between 10% and 90%
    chatPanelSize.value = newChatPanelSize;
    chatParticipantsSize.value = 100 - newChatPanelSize;
  } else {
    const deltaY = event.movementY;
    const totalHeight = document.body.clientHeight;
    const deltaPercent = (deltaY / totalHeight) * 100;

    let newChatPanelSize = chatPanelSize.value + deltaPercent;
    newChatPanelSize = Math.min(Math.max(newChatPanelSize, 10), 90); // Clamp between 10% and 90%
    chatPanelSize.value = newChatPanelSize;
    chatParticipantsSize.value = 100 - newChatPanelSize;
  }
};

const stopResize = () => {
  isResizing.value = false;
  if (import.meta.client) {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', stopResize);
  }
};
</script>

<style scoped>
.divider {
  position: relative;
}

.divider-icon > svg {
  width: 16px;
  height: 16px;
}

</style>
