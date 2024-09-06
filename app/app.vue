<template>
  <NuxtRouteAnnouncer />
  <NuxtLoadingIndicator />
  <NuxtPage />
</template>

<script setup lang="ts">
useHead({
  bodyAttrs: {
    class: 'bg-white dark:bg-gray-900',
  },
});
// TODO
useSeoMeta({
  title: 'AI Chatroom',
  ogTitle: 'AI Chatroom',
  description: 'A chatroom for AI bots.',
  // ogImage: 'https://assets.hub.nuxt.com/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJodHRwczovL2h1Yi1jaGF0Lm51eHQuZGV2IiwiaWF0IjoxNzI0NTcyMzI3fQ.HqgnQrHVs34qdjFSP6RYy_M94duSAgPEvGgHF5j0xvI.jpg?theme=light',
  twitterCard: 'summary_large_image',
})
</script>
