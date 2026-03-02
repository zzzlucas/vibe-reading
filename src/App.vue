<template>
  <div class="app-shell">
    <RouterView />
  </div>

  <!-- Modals -->
  <SettingsModal />
  <ProfileModal />
  <ActivatePro />
  <TocModal />
  <HelpModal />
  <ConfirmModal />
  <MiniSettingsTrigger />


  <div class="toast" :class="[store.toastVisible ? 'show' : '', store.toastType === 'preview' ? 'preview-toast' : '', store.toastType === 'achievement' ? 'achievement-toast' : '', store.toastType === 'action' ? 'action-toast' : '', store.toastType === 'info' ? 'info-toast' : '']">
    <icon-material-symbols-auto-awesome v-if="store.toastType === 'preview'" />
    <icon-material-symbols-military-tech v-else-if="store.toastType === 'achievement'" />
    <icon-material-symbols-info v-else-if="store.toastType === 'action' || store.toastType === 'info'" />
    <span v-if="store.toastType === 'info'">{{ store.toastMessage }}</span>
    <div v-else-if="store.toastType === 'preview'" class="preview-toast-content">
      <span>{{ store.toastMessage }} <b style="margin-left:4px">{{ store.previewTimer }}s</b></span>
      <button class="toast-close-btn" @click="cancelPreview">立即结束</button>
    </div>
    <div v-else-if="store.toastType === 'achievement'" class="achievement-toast-content">
      <span>{{ store.toastMessage }}</span>
    </div>
    <div v-else-if="store.toastType === 'action'" class="action-toast-content">
      <span>{{ store.toastMessage }}</span>
      <button class="toast-close-btn action-btn" @click="store.handleToastAction()">{{ store.toastActionText }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watchEffect, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAppStore } from '@/store/appStore';

import SettingsModal from '@/components/Modals/SettingsModal.vue';
import ProfileModal from '@/components/Modals/ProfileModal.vue';
import ActivatePro from '@/components/Modals/ActivatePro.vue';
import TocModal from '@/components/Modals/TocModal.vue';
import HelpModal from '@/components/Modals/HelpModal.vue';
import ConfirmModal from '@/components/Modals/ConfirmModal.vue';
import MiniSettingsTrigger from '@/components/MiniSettingsTrigger.vue';

const store = useAppStore();
const router = useRouter();
const route = useRoute();

// Sync state to URL
watch(() => store.activeNovelId, (newId) => {
  if (newId) {
    if (route.params.id !== newId) {
      router.push(`/app/${newId}`);
    }
  } else {
    if (route.path !== '/') {
      router.push('/');
    }
  }
});

// Sync URL ID to content loading
watch(() => route.params.id, async (newId) => {
  if (newId) {
    const id = newId as string;
    // Only trigger if store is not already on this novel
    if (store.activeId !== id) {
      const index = store.novels.findIndex(n => n.id === id);
      if (index >= 0) {
        await store.openNovel(index);
      }
    }
  } else {
    store.activeId = null;
    store.pages = [];
  }
});

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', store.theme);
  document.documentElement.setAttribute('data-style', store.style);
});

function cancelPreview() {
  store.toastVisible = false;
  store.previewTimer = 0;
  // The SettingsModal setStyle will handle the revert if it sees the Toast closed
}

function viewAchievement() {
  store.showSettings = true;
  store.autoExpandAdvanced = true;
  store.isNewAchievement = true;
  store.toastVisible = false;
  
  // Wait for modal to render and its transition to settle, then scroll to the specific section
  nextTick(() => {
    setTimeout(() => {
      const el = document.getElementById('achievement-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      // Only highlight for 2 seconds per user request
      setTimeout(() => {
        store.isNewAchievement = false;
      }, 2000);
    }, 500); 
  });
}

async function checkActivation() {
  const token = localStorage.getItem('deep_reader_token');
  if (!token) {
    return false;
  }

  try {
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await res.json();
    if (data.valid) {
      store.isPro = true;
      return true;
    }
  } catch (err) {
    console.warn('Verify API failed, offline or server down. Assuming invalid.', err);
  }

  // Token invalid or expired
  localStorage.removeItem('deep_reader_token');
  return false;
}

onMounted(async () => {
  // Initialization Sequence
  checkActivation(); // Background check, non-blocking
  
  await store.initStore();

  const idFromUrl = route.params.id as string;
  if (idFromUrl) {
    const index = store.novels.findIndex(n => n.id === idFromUrl);
    if (index >= 0) {
      await store.openNovel(index);
    }
  }
});
</script>

<style lang="less">
/* We import the global styles here! */
</style>
