<template>
  <div class="settings-section" :class="{ 'is-collapsed': isCollapsed }">
    <div class="section-header" @click="isCollapsed = !isCollapsed">
      <h3>外观</h3>
      <icon-material-symbols-expand-more class="collapse-icon" />
    </div>
    <div class="section-body">
      <div class="setting-item">
        <div class="setting-label">
          <icon-material-symbols-palette />
          <span>主题模式</span>
        </div>
        <div class="setting-control">
          <div class="theme-switch-group">
            <button class="theme-opt" :class="{ active: store.theme === 'dark' }" @click="store.theme = 'dark'" title="深色">
              <icon-material-symbols-dark-mode />
              <span>深色</span>
            </button>
            <button class="theme-opt" :class="{ active: store.theme === 'light' }" @click="store.theme = 'light'" title="浅色">
              <icon-material-symbols-light-mode />
              <span>浅色</span>
            </button>
          </div>
        </div>
      </div>
      <div class="setting-item">
        <div class="setting-label">
          <icon-material-symbols-style />
          <span>界面风格</span>
          <div class="mini-switch-wrap" @click="store.autoPreview = !store.autoPreview" :title="store.autoPreview ? '点击关闭自动预览' : '开启后，切换风格时设置弹窗将自动收起 1.5 秒'">
            <div class="mini-switch" :class="{ active: store.autoPreview }"></div>
            <span>自动预览</span>
          </div>
        </div>
        <div class="setting-control style-selector-wrap">
          <div class="style-selector">
            <button v-for="[key, config] in freeStyles" :key="key" 
                    class="style-opt" :class="{ active: store.style === key }" 
                    @click="setStyle(key as StyleName)">
              <div class="style-icon" :style="{ background: config.dotBg }"></div>
              <span>{{ config.uiName }}</span>
            </button>
            <div style="width:100%; height:1px; background:rgba(128,128,128,0.1); margin:4px 0"></div>
            <button v-for="[key, config] in betaStyles" :key="key" 
                    class="style-opt" :class="{ active: store.style === key }" 
                    @click="setStyle(key as StyleName)">
              <div class="style-icon" :style="{ background: config.dotBg }"></div>
              <span>{{ config.uiName }}</span>
              <span :class="['tag', getTagClass(config)]">{{ config.betaText || (config.tagType === 'pro' ? 'Pro' : '未上线') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useAppStore } from '@/store/appStore';
import { STYLE_CONFIG } from '@/config/constants';
import { emit } from '@/utils/tracker';
import type { StyleName } from '@/types';

const store = useAppStore();
const isCollapsed = ref(false);
let peekTimer: any = null;

const getTagClass = (config: any) => {
  if (config.tagType === 'free') return 'tag-free';
  if (config.tagType === 'pro') return 'tag-pro';
  return 'tag-beta';
};

const freeStyles = Object.entries(STYLE_CONFIG).filter(([_, conf]) => !conf.isBeta);
const betaStyles = Object.entries(STYLE_CONFIG).filter(([_, conf]) => conf.isBeta);

function setStyle(style: StyleName) {
  const config = STYLE_CONFIG[style];

  // 埋点：记录用户点击的目标风格（含未上线的）
  emit(1004, { to: style });

  // Disable "Not Online" (未上线) styles
  const isNotOnline = config.isBeta && !config.betaText && config.tagType !== 'pro' && config.tagType !== 'free';
  if (isNotOnline) {
    store.showToast('该风格正在开发中，敬请期待！');
    return;
  }

  if (config.isBeta && config.tagType !== 'free' && !store.isPro) {
    if (store.previewTimer > 0) return;
    const originalStyle = store.style;
    store.style = style;
    store.showSettings = false; 
    store.previewTimer = 5;
    store.showToast('✨ 正在为您开启风格预览', 'preview');
    
    const interval = setInterval(() => {
      store.previewTimer--;
      if (store.previewTimer <= 0 || !store.toastVisible) {
        clearInterval(interval);
        store.toastVisible = false;
        store.previewTimer = 0;
        if (!store.isPro) {
          store.style = originalStyle;
        }
        store.showSettings = true;
      }
    }, 1000);
    return;
  }

  store.style = style;

  if (store.autoPreview) {
    store.showSettings = false;
    store.previewTimer = 5;
    store.showToast('✨ 正在为您开启自动预览', 'preview');
    
    if (peekTimer) clearInterval(peekTimer);
    peekTimer = setInterval(() => {
      store.previewTimer--;
      if (store.previewTimer <= 0 || !store.toastVisible) {
        clearInterval(peekTimer);
        store.toastVisible = false;
        store.previewTimer = 0;
        store.showSettings = true;
      }
    }, 1000);
  }
}

// Sync collapsed state with parent if needed, but here we just use local.
// However, the parent modal logic saves toggle state to localStorage.
// We can handle that here too.
onMounted(() => {
  const saved = localStorage.getItem('find_deep_collapsed_sections');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.appearance !== undefined) isCollapsed.value = parsed.appearance;
    } catch (e) {}
  }
});

watch(isCollapsed, (val) => {
  const saved = localStorage.getItem('find_deep_collapsed_sections') || '{}';
  try {
    const parsed = JSON.parse(saved);
    parsed.appearance = val;
    localStorage.setItem('find_deep_collapsed_sections', JSON.stringify(parsed));
  } catch (e) {}
});
</script>
