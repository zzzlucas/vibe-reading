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
    <template v-if="!store.toastHasIcon">
      <icon-material-symbols-auto-awesome v-if="store.toastType === 'preview'" />
      <icon-material-symbols-military-tech v-else-if="store.toastType === 'achievement'" />
      <icon-material-symbols-info v-else-if="store.toastType === 'action' || store.toastType === 'info'" />
    </template>
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
import { onMounted, watchEffect, nextTick, watch, ref, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAppStore } from '@/store/appStore';
import { apiFetch } from '@/utils/request';
import { initSecurityMonitor } from '@/utils/tracker';

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

import { STYLE_CONFIG } from '@/config/constants';

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', store.theme);
  document.documentElement.setAttribute('data-style', store.style);
  
  // Favicon dynamic updating
  const favicon = document.getElementById('favicon') as HTMLLinkElement;
  if (favicon) {
    const styleFavicon = STYLE_CONFIG[store.style]?.favicon;
    let newFavicon = '/pwa-512.svg'; // Default minimalistic transparent icon
    
    // Check if it's a valid remote url or specific path
    if (styleFavicon && (styleFavicon.startsWith('http') || styleFavicon.startsWith('data:') || styleFavicon.startsWith('/'))) {
      newFavicon = styleFavicon;
    }
    
    // Only update to prevent unnecessary repaints/reload
    // Ensure absolute resolution for checking to prevent mismatches
    if (!favicon.href.includes(newFavicon.replace(/^\//, ''))) {
      favicon.href = newFavicon;
    }
  }
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
  let token = localStorage.getItem('find_deep_token');
  
  try {
    const { IdentityDB } = await import('@/utils/db');
    await IdentityDB.open();
    const idbToken = await IdentityDB.get('token');
    if (!token && idbToken) {
      token = idbToken; // 恢复丢失的 token
      localStorage.setItem('find_deep_token', token);
    } else if (token && token !== idbToken) {
      await IdentityDB.set('token', token); // 下发同步给 idb
    }
  } catch (err) {}

  if (!token) return false;

  try {
    const res = await apiFetch('/api/verify', {
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
    return false; // 如果服务端报错，本次暂时不清除 token 的本地持久化以防网络问题误杀
  }

  // Token invalid or expired
  localStorage.removeItem('find_deep_token');
  try {
    const { IdentityDB } = await import('@/utils/db');
    await IdentityDB.open();
    await IdentityDB.delete('token');
  } catch (err) {}
  return false;
}

// Active reading tracking
const isUserActive = ref(true);
let trackInterval: any = null;
let activityTimeout: any = null;

function markActive() {
  isUserActive.value = true;
  if (activityTimeout) clearTimeout(activityTimeout);
  activityTimeout = setTimeout(() => {
    isUserActive.value = false;
  }, 10000); // 10s idle = inactive
}

onMounted(async () => {
  // Initialization Sequence
  checkActivation(); // Background check, non-blocking
  
  await store.initStore();

  // 初始化信号采集（安全监测 + 批量上报定时器）
  initSecurityMonitor();

  const idFromUrl = route.params.id as string;
  if (idFromUrl) {
    const index = store.novels.findIndex(n => n.id === idFromUrl);
    if (index >= 0) {
      await store.openNovel(index);
    }
  }

  // Tracking: First Open
  if (!localStorage.getItem('find_deep_first_open_tracked')) {
    store.trackEvent('first_open', { url: window.location.href });
    localStorage.setItem('find_deep_first_open_tracked', 'true');
  }

  // Handle invite links
  const queryInvite = route.query.invite as string;
  if (queryInvite) {
    const code = queryInvite.trim().toUpperCase();
    await store.saveInvitedBy(code);
    
    // Strip from URL
    const newQuery = { ...route.query };
    delete newQuery.invite;
    router.replace({ path: route.path, query: newQuery });
  }

  // Auto-consume invite code silently
  const storedInvite = await store.getInvitedBy();
  if (storedInvite) {
    const deviceId = await store.ensureDeviceId();
    apiFetch('/api/invite/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: storedInvite, deviceId })
    }).then(() => {}).catch(() => {});
  }

  // Active reading tracking
  window.addEventListener('mousemove', markActive);
  window.addEventListener('keydown', markActive);
  window.addEventListener('click', markActive);
  window.addEventListener('touchstart', markActive);
  window.addEventListener('scroll', markActive);

  trackInterval = setInterval(() => {
    if (!store.inviteValidated && isUserActive.value && store.activeId) {
       store.activeReadingSeconds++;
       if (store.activeReadingSeconds % 10 === 0) { // Check every 10s
          store.checkInviteValidation();
       }
    }
  }, 1000);

  _logVibeConsole();
});

onBeforeUnmount(() => {
  if (trackInterval) clearInterval(trackInterval);
  if (activityTimeout) clearTimeout(activityTimeout);
  window.removeEventListener('mousemove', markActive);
  window.removeEventListener('keydown', markActive);
  window.removeEventListener('click', markActive);
  window.removeEventListener('touchstart', markActive);
  window.removeEventListener('scroll', markActive);
});

function _logVibeConsole() {
  if ((window as any)._vibeLogged) return;
  (window as any)._vibeLogged = true;

  const quotes = [
    "“18世纪的工人在砸纺织机，21世纪的我们在用 AI 写周报，用 FindDeep 阅读。”",
    "“AI 负责让老板觉得你产出惊人，FindDeep 负责让你在这个过程中保持灵魂有趣。”",
    "“不反抗技术，只反抗注视。正在为您注入赛博伪装协议...”"
  ];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  
  console.log(
    `%c ${store.appTitle} %c ${quote} `,
    'background: #8ab4f8; color: #131314; padding: 2px 4px; border-radius: 4px; font-weight: bold;',
    'color: #8ab4f8; font-style: italic;'
  );
}


</script>

<style lang="less">
/* We import the global styles here! */
</style>
