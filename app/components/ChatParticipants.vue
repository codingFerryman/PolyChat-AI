<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="flex items-center justify-between px-4 h-14">
      <div class="flex items-center gap-x-4">
        <h2 class="md:text-lg text-gray-600 dark:text-gray-300">
          Participants
        </h2>
        <UTooltip v-if="chatParticipants.length > 0" text="Clear participants">
          <UButton
              color="gray"
              icon="i-heroicons-trash"
              @click="$emit('clearParticipants')"
          />
        </UTooltip>
      </div>
    </div>
    <UDivider/>
    <div class="p-4 flex-1 space-y-6 overflow-y-auto">
      <ul>
        <li v-for="participant in chatParticipants" :key="participant.id">
          {{ participant.id }} - {{ participant.llmParams.model }} - {{ participant.llmParams.systemPrompt }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type {Participant} from '~~/types';

defineProps({
  chatParticipants: {
    type: Array as PropType<Participant[]>,
    required: true
  }
});

const emit = defineEmits<{
  clearParticipants: [];
}>();


</script>