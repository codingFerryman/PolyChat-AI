<template>
  <div class="flex items-center justify-between px-4 h-14">
    <div class="flex items-center gap-x-4">
      <h2 class="text-xl md:text-2xl text-primary font-bold">Chat</h2>
      <UTooltip v-if="!clearDisabled" text="Clear chat">
        <UButton
            color="gray"
            icon="i-heroicons-trash"
            @click="$emit('clearHistory')"
        />
      </UTooltip>
    </div>
    <div class="flex items-center gap-x-4">
      <ColorMode />
      <UButton
          icon="i-simple-icons-github"
          color="gray"
          variant="ghost"
          to="https://github.com/codingFerryman/ai-chatroom"
          target="_blank"
      />
      <UButton
          icon="i-heroicons-cog-6-tooth"
          color="gray"
          variant="ghost"
          class="md:hidden"
          @click="$emit('showDrawer')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits([
  'clearHistory',
  'showDrawer'
]);

defineProps({
  clearDisabled: {
    type: Boolean,
    default: true,
  },
});
</script>
