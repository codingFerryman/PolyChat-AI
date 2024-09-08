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
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50"/>
        <tbody class="divide-y divide-gray-200">
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
        </tr>
        </tbody>
      </table>
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

defineEmits<{
  clearParticipants: [];
}>();


</script>