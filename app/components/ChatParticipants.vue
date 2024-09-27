<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="flex items-center justify-between px-4 h-14">
      <div class="flex items-center gap-x-4">
        <h2 class="md:text-lg text-gray-600 dark:text-gray-300">
          Participants
        </h2>
        <UTooltip text="Add participant">
          <UButton
            color="gray"
            icon="i-heroicons-plus"
            @click="$emit('showLlmSettings')"
          />
        </UTooltip>
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
    <div class="p-1 flex-1 space-y-6 overflow-y-auto">
      <table class="min-w-full">
        <thead class="bg-gray-50"/>
        <tbody class="divide-y divide-gray-800">
        <tr v-for="participant in chatParticipants" :key="participant.id">
          <td class="px-2 py-2 whitespace-nowrap">
            <UPopover mode="hover">
              <UIcon :name="`${participant.icon}`" :style="`color:${participant.iconColor}`"/>
              <template #panel>
                <tr v-for="(value, key) in participant.llmParams" :key="key">
                  <td>{{key}}: {{value}}</td>
                </tr>
                Joined: <NuxtTime :datetime="participant.id" month="long" day="numeric" hour="numeric" minute="numeric" second="numeric" />
              </template>
            </UPopover>
          </td>
          <td class="px-4 py-4">
            {{ participant.role }}
          </td>
          <td class="px-4 py-4 whitespace-nowrap">
            {{ participant.llmParams.model.split("/").at(-1) }}
          </td>
          <td class="px-4 py-4">
            <UButton
                color="red"
                icon="i-heroicons-trash"
                variant="ghost"
                @click="removeParticipant(participant.id)"
            />
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type {Participant} from '~~/types';

function removeParticipant(id: number) {
  emit('removeParticipant', id);
}

defineProps({
  chatParticipants: {
    type: Array as PropType<Participant[]>,
    required: true
  }
});

const emit = defineEmits<{
  clearParticipants: [];
  showLlmSettings: [];
  removeParticipant: [id: number];
}>();


</script>