<template>
  <div class="settings-section" v-if="!store.isPro" :class="{ 'is-collapsed': isCollapsed }">
    <div class="section-header" @click="isCollapsed = !isCollapsed">
      <h3>升级 Pro</h3>
      <icon-material-symbols-expand-more class="collapse-icon" />
    </div>
    <div class="section-body">
      <div class="setting-item pro-banner" style="display:flex;flex-direction:column;align-items:flex-start;background:var(--bg-input);padding:16px;border-radius:12px;border:1px solid var(--border-color);gap:12px">
        <div style="display:flex;align-items:center;gap:8px">
          <icon-material-symbols-workspace-premium style="color:var(--text-link)" />
          <span style="font-weight:500">{{ store.appTitle }} Pro</span>
        </div>
        <p style="font-size:13px;color:var(--text-secondary);margin:0;line-height:1.5">激活卡密以解锁全量功能，开启本地隐私环境下极致的氛围阅读新体验。</p>
        <button class="setting-btn" @click="openPro" style="background:var(--text-primary);color:var(--bg-primary);border:none;margin-top:4px">输入卡密升级</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useAppStore } from '@/store/appStore';

const store = useAppStore();
const isCollapsed = ref(false);

function openPro() {
  store.showSettings = false;
  store.showActivateModal = true;
}

onMounted(() => {
  const saved = localStorage.getItem('deep_reader_collapsed_sections');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.pro !== undefined) isCollapsed.value = parsed.pro;
    } catch (e) {}
  }
});

watch(isCollapsed, (val) => {
  const saved = localStorage.getItem('deep_reader_collapsed_sections') || '{}';
  try {
    const parsed = JSON.parse(saved);
    parsed.pro = val;
    localStorage.setItem('deep_reader_collapsed_sections', JSON.stringify(parsed));
  } catch (e) {}
});
</script>
