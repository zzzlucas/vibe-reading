<template>
  <div class="activate-overlay" v-if="store.showActivateModal">
    <div class="activate-card relative">
      <button class="icon-btn modal-close activate-close-btn" @click="store.showActivateModal = false">
        <icon-material-symbols-close />
      </button>
      <div class="activate-header">
        <div class="activate-sparkle">
          <icon-material-symbols-workspace-premium />
        </div>
        <h1 class="activate-title">升级 {{ store.appTitle }} Pro</h1>
        <p class="activate-subtitle">请输入卡密以解锁高级产品特性</p>
      </div>

      <div class="activate-body">
        <div class="activate-input-wrap">
          <icon-material-symbols-key class="activate-key-icon" />
          <input
            type="text"
            v-model="cardKey"
            @keydown.enter="handleActivate"
            class="activate-input"
            placeholder="XXXX-XXXX-XXXX"
            maxlength="32"
            autocomplete="off"
            spellcheck="false"
          />
        </div>

        <button class="activate-btn" :disabled="loading" @click="handleActivate">
          <icon-material-symbols-lock-open />
          {{ loading ? '正在验证...' : '立即激活' }}
        </button>

        <div class="activate-status" :class="statusType">{{ statusMsg }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAppStore } from '@/store/appStore';

const store = useAppStore();

const cardKey = ref('');
const loading = ref(false);
const statusMsg = ref('');
const statusType = ref('');

watch(() => store.showActivateModal, (val) => {
  if (!val) {
    cardKey.value = '';
    statusMsg.value = '';
    statusType.value = '';
  }
});

async function handleActivate() {
  store.trackEvent('click_activate_pro');
  const code = cardKey.value.trim();
  if (!code) {
    statusType.value = 'error';
    statusMsg.value = '请输入有效的卡密';
    return;
  }

  loading.value = true;
  statusType.value = 'loading';
  statusMsg.value = '正在验证...';

  try {
    const res = await fetch('/api/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem('deep_reader_token', data.token);
      try {
        await store.ensureDeviceId(); // just ensuring idb is basically ready
        await import('@/utils/db').then(m => {
           m.IdentityDB.open().then(() => m.IdentityDB.set('token', data.token));
        });
      } catch(err) {}
      statusType.value = 'success';
      statusMsg.value = data.message;
      store.isPro = true;
      setTimeout(() => {
        store.showActivateModal = false;
        loading.value = false;
      }, 1500);
    } else {
      statusType.value = 'error';
      statusMsg.value = data.error || '激活失败';
      loading.value = false;
    }
  } catch (err) {
    statusType.value = 'error';
    statusMsg.value = '网络连接失败，请检查服务状态';
    loading.value = false;
  }
}
</script>

<style scoped lang="less">
.activate-overlay {
  position: fixed;
  inset: 0;
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: activateBgIn 0.4s ease;
}

@keyframes activateBgIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.activate-card {
  width: 100%;
  max-width: 420px;
  margin: 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  animation: activateCardIn 0.45s cubic-bezier(0.22, 0.68, 0, 1.2);
  position: relative;
}

@keyframes activateCardIn {
  from { opacity: 0; transform: translateY(24px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.activate-header {
  padding: 36px 32px 24px;
  text-align: center;
  background: linear-gradient(160deg, var(--bg-surface) 0%, var(--bg-surface-hover) 100%);
  border-bottom: 1px solid var(--border-color);
}

.activate-sparkle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--sparkle-bg);
  margin-bottom: 16px;
  animation: sparkleFloat 3s ease-in-out infinite;

  .material-symbols-outlined {
    font-size: 32px;
    color: #fff;
  }
}

@keyframes sparkleFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.activate-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
  margin-bottom: 6px;
}

.activate-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.activate-body {
  padding: 28px 32px;
}

.activate-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-input);
  border: 1.5px solid var(--border-color);
  border-radius: 12px;
  padding: 0 16px;
  transition: border-color 0.2s, box-shadow 0.2s;
  margin-bottom: 16px;

  &:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(138, 180, 248, 0.12);
  }
}

.activate-key-icon {
  color: var(--text-muted);
  font-size: 20px;
  flex-shrink: 0;
}

.activate-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 15px;
  font-family: inherit;
  color: var(--text-primary);
  padding: 14px 0;
  letter-spacing: 0.5px;

  &::placeholder {
    color: var(--text-muted);
    letter-spacing: 0;
  }
}

.activate-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--gradient-start), var(--gradient-mid));
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  box-shadow: 0 4px 16px rgba(66, 133, 244, 0.3);

  &:hover {
    opacity: 0.92;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(66, 133, 244, 0.4);
  }

  &:active {
    transform: translateY(0);
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .material-symbols-outlined {
    font-size: 20px;
  }
}

.activate-status {
  margin-top: 14px;
  min-height: 20px;
  font-size: 13px;
  text-align: center;
  line-height: 1.6;
  transition: all 0.2s;

  &.error { color: var(--accent-pink); }
  &.success { color: var(--accent-green); }
  &.loading { color: var(--text-muted); }
}

.activate-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
}
</style>
