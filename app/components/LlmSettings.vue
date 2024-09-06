<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="flex items-center justify-between px-4 h-14">
      <div class="flex items-center gap-x-4">
        <h2 class="md:text-lg text-gray-600 dark:text-gray-300">
          LLM Settings
        </h2>
      </div>
      <UButton
          class="md:hidden"
          color="gray"
          icon="i-heroicons-x-mark-20-solid"
          variant="ghost"
          @click="$emit('hideDrawer')"
      />
    </div>
    <UDivider/>
    <div class="p-4 flex-1 space-y-6 overflow-y-auto">
      <UFormGroup label="Model">
        <USelectMenu
            v-model="llmParams.model"
            :options="models"
            option-attribute="name"
            size="md"
            value-attribute="id"
        />
      </UFormGroup>

      <RangeInput
          v-model="llmParams.temperature"
          :max="5"
          :min="0"
          :step="0.1"
          label="Temperature"
      />

      <RangeInput
          v-model="llmParams.maxTokens"
          :max="4096"
          :min="1"
          label="Max Tokens"
      />

      <UFormGroup label="System Prompt">
        <UTextarea
            v-model="llmParams.systemPrompt"
            :maxrows="8"
            :rows="3"
            autoresize
        />
      </UFormGroup>

      <div class="flex items-center justify-between">
        <span>Stream Response</span>
        <UToggle v-model="llmParams.stream"/>
      </div>

      <UAccordion
          :items="accordionItems"
          color="white"
          size="md"
          variant="solid"
      >
        <template #item>
          <UCard :ui="{ body: { base: 'space-y-6', padding: 'p-4 sm:p-4' } }">
            <RangeInput
                v-model="llmParams.topP"
                :max="2"
                :min="0"
                :step="0.1"
                label="Top P"
            />

            <RangeInput
                v-model="llmParams.topK"
                :max="50"
                :min="1"
                label="Top K"
            />

            <RangeInput
                v-model="llmParams.frequencyPenalty"
                :max="2"
                :min="0"
                :step="0.1"
                label="Frequency Penalty"
            />

            <RangeInput
                v-model="llmParams.presencePenalty"
                :max="2"
                :min="0"
                :step="0.1"
                label="Presence Penalty"
            />
          </UCard>
        </template>
      </UAccordion>

      <UButton
          block
          color="gray"
          size="sm"
          @click="$emit('reset')"
      >Reset settings
      </UButton>
      <UButton
          block
          color="orange"
          size="sm"
          @click="addParticipant"
      >Join
      </UButton>
    </div>
    <div class="p-2">
      <UButton color="gray" rel="noopener" size="sm" target="_blank" to="https://hub.nuxt.com?utm_source=hub-chat"
               variant="link">Hosted on NuxtHub
      </UButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type {LlmParams, Participant} from '~~/types';

const llmParams = defineModel('llmParams', {
  type: Object as () => LlmParams,
  required: true,
});

const emit = defineEmits(['hideDrawer', 'reset', 'add-participant']);

function addParticipant() {
  const newParticipant: Participant = {
    id: Date.now().toString(), // Using the current timestamp as an ID
    llmParams: {...llmParams.value},
  };
  console.log('llm:addParticipant', newParticipant);
  emit('add-participant', newParticipant);
}

const accordionItems = [
  {
    label: 'Advanced Settings',
    defaultOpen: false,
  },
];

const models = [
  {
    name: 'deepseek-coder-6.7b-base-awq',
    id: '@hf/thebloke/deepseek-coder-6.7b-base-awq',
  },
  {
    name: 'deepseek-coder-6.7b-instruct-awq',
    id: '@hf/thebloke/deepseek-coder-6.7b-instruct-awq',
  },
  {
    name: 'deepseek-math-7b-base',
    id: '@cf/deepseek-ai/deepseek-math-7b-base',
  },
  {
    name: 'deepseek-math-7b-instruct',
    id: '@cf/deepseek-ai/deepseek-math-7b-instruct',
  },
  {
    name: 'discolm-german-7b-v1-awq',
    id: '@cf/thebloke/discolm-german-7b-v1-awq',
  },
  {name: 'falcon-7b-instruct', id: '@cf/tiiuae/falcon-7b-instruct'},
  {name: 'gemma-2b-it-lora', id: '@cf/google/gemma-2b-it-lora'},
  {name: 'gemma-7b-it-lora', id: '@cf/google/gemma-7b-it-lora'},
  {name: 'gemma-7b-it', id: '@hf/google/gemma-7b-it'},
  {
    name: 'hermes-2-pro-mistral-7b',
    id: '@hf/nousresearch/hermes-2-pro-mistral-7b',
  },
  {name: 'llama-2-13b-chat-awq', id: '@hf/thebloke/llama-2-13b-chat-awq'},
  {name: 'llama-2-7b-chat-fp16', id: '@cf/meta/llama-2-7b-chat-fp16'},
  {
    name: 'llama-2-7b-chat-hf-lora',
    id: '@cf/meta-llama/llama-2-7b-chat-hf-lora',
  },
  {name: 'llama-3-8b-instruct', id: '@cf/meta/llama-3-8b-instruct'},
  {name: 'llama-3-8b-instruct-awq', id: '@cf/meta/llama-3-8b-instruct-awq'},
  {name: 'llama-3.1-8b-instruct', id: '@cf/meta/llama-3.1-8b-instruct'},
  {
    name: 'llama-3.1-8b-instruct-awq',
    id: '@cf/meta/llama-3.1-8b-instruct-awq',
  },
  {
    name: 'llama-3.1-8b-instruct-fp8',
    id: '@cf/meta/llama-3.1-8b-instruct-fp8',
  },
  {name: 'llamaguard-7b-awq', id: '@hf/thebloke/llamaguard-7b-awq'},
  {
    name: 'mistral-7b-instruct-v0.1',
    id: '@cf/mistral/mistral-7b-instruct-v0.1',
  },
  {
    name: 'mistral-7b-instruct-v0.1-awq',
    id: '@hf/thebloke/mistral-7b-instruct-v0.1-awq',
  },
  {
    name: 'mistral-7b-instruct-v0.2-lora',
    id: '@cf/mistral/mistral-7b-instruct-v0.2-lora',
  },
  {
    name: 'mistral-7b-instruct-v0.2',
    id: '@hf/mistral/mistral-7b-instruct-v0.2',
  },
  {
    name: 'neural-chat-7b-v3-1-awq',
    id: '@hf/thebloke/neural-chat-7b-v3-1-awq',
  },
  {name: 'openchat-3.5-0106', id: '@cf/openchat/openchat-3.5-0106'},
  {
    name: 'openhermes-2.5-mistral-7b-awq',
    id: '@hf/thebloke/openhermes-2.5-mistral-7b-awq',
  },
  {name: 'phi-2', id: '@cf/microsoft/phi-2'},
  {name: 'qwen1.5-0.5b-chat', id: '@cf/qwen/qwen1.5-0.5b-chat'},
  {name: 'qwen1.5-1.8b-chat', id: '@cf/qwen/qwen1.5-1.8b-chat'},
  {name: 'qwen1.5-14b-chat-awq', id: '@cf/qwen/qwen1.5-14b-chat-awq'},
  {name: 'qwen1.5-7b-chat-awq', id: '@cf/qwen/qwen1.5-7b-chat-awq'},
  {name: 'sqlcoder-7b-2', id: '@cf/defog/sqlcoder-7b-2'},
  {name: 'starling-lm-7b-beta', id: '@hf/nexusflow/starling-lm-7b-beta'},
  {
    name: 'tinyllama-1.1b-chat-v1.0',
    id: '@cf/tinyllama/tinyllama-1.1b-chat-v1.0',
  },
  {
    name: 'una-cybertron-7b-v2-bf16',
    id: '@cf/fblgit/una-cybertron-7b-v2-bf16',
  },
  {name: 'zephyr-7b-beta-awq', id: '@hf/thebloke/zephyr-7b-beta-awq'},
];
</script>
