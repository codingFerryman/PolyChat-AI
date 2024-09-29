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
          @remove-participant="removeParticipant"
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

const modSystemPrompt: string = "" +
    "You are the moderator of a role-playing chatroom where the participants are AI language models acting in character. Your responsibilities include:\n" +
    "\n" +
    "- Generating concise role-play name cards for each participant that summarize their character roles.\n" +
    "- Reviewing and revising participants' system prompts to ensure they align with the role-playing scenario.\n" +
    "- Maintaining the flow of the conversation by ensuring all participants stay in character and interact appropriately.\n" +
    "- Facilitating a collaborative and engaging environment for the role-play.\n" +
    "\n" +
    "Please perform your duties diligently while keeping the interactions seamless and enjoyable."

const modSettings: LlmParams = {
  model: '@openai/gpt-4o-mini',
  temperature: 0.6,
  maxTokens: 512,
  systemPrompt: modSystemPrompt,
  stream: false,
};

const modInitMessage: string = "" +
    "Please create a concise role-play name card that summarizes a participant's character role. The name card should:\n" +
    "\n" +
    "- Be no more than three words.\n" +
    "- Capture the essence of the character effectively.\n" +
    "- Contain only the name or title without any additional explanations or text.\n" +
    "- In plain text.\n" +
    "\n" +
    "Please provide only the content of the name card.\n" +
    "\n" +
    "**Participant's System Prompt to Summarize:**\n"

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

const removeParticipant = (id: number) => {
  chatParticipants.value = chatParticipants.value.filter(
      (participant) => participant.id !== id
  );
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
    const processedHistory = processHistory(chatHistory.value, participant, isMod, message);
    return await getResponse('/api/cloudflareAiGateway', processedHistory, thisLlmParams);
  } catch (error) {
    console.error('Error sending message:', error);
  } finally {
    loading.value = 'idle';
  }
}

function processHistory(
    history: ParticipantChatMessage[],
    participant: Participant,
    isMod: boolean,
    userMessage?: string
): ChatMessage[] {
  const tempHistory: ChatMessage[] = [];

  // Add the appropriate system prompt
  const systemPrompt = isMod
      ? modSettings.systemPrompt
      : participant.llmParams.systemPrompt + '\n' +
      'Please follow the following guidelines when participating in the chat:' +
      '- Messages from other participants will be prefixed with their role in the format: [Role]: Message.\n' +
      '- Your own messages will **not** include a role label; just provide your response directly.\n' +
      '- Stay in character at all times and respond appropriately to the conversation.\n'
      || '';
  tempHistory.push({ role: 'system', content: systemPrompt });

  // Process the chat history
  history.forEach((message) => {
    const sender = message.participant;
    const senderRole = sender?.role || 'Unknown';
    const messageContent = message.content || '';

    if (sender?.id === participant.id) {
      // Assistant's own previous messages - do not include role label
      tempHistory.push({
        role: 'assistant',
        content: messageContent, // No role label
      });
    } else {
      // Messages from other participants - include role label
      const formattedContent = `[${senderRole}]: ${messageContent}`;
      tempHistory.push({
        role: 'user',
        content: formattedContent,
      });
    }
  });

  // Include the optional user message
  if (userMessage && userMessage.length > 0) {
    // Assuming the user message is from an external user, include role label
    const formattedUserMessage = `[User]: ${userMessage}`;
    tempHistory.push({ role: 'user', content: formattedUserMessage });
  }

  return tempHistory;
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
