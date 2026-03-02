<template>
  <div class="app-container" :class="{ 'blog1-mode': isBlog1 }">
    <template v-if="isBlog1">
      <ClassicBlog1Layout />
    </template>
    <template v-else>
      <Sidebar />
      <ReaderScreen />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/store/appStore';
import Sidebar from '@/components/Sidebar.vue';
import ReaderScreen from '@/components/ReaderScreen.vue';
import ClassicBlog1Layout from '@/components/ClassicBlog1Layout.vue';

const store = useAppStore();
const isBlog1 = computed(() => store.style === 'classic_blog1');
</script>
