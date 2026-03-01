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
            <button class="style-opt" :class="{ active: store.style === 'gemini' }" @click="setStyle('gemini')">
              <div class="style-icon gemini-dot"></div>
              <span>Gemini</span>
            </button>
            <button class="style-opt" :class="{ active: store.style === 'chatgpt' }" @click="setStyle('chatgpt')">
              <div class="style-icon chatgpt-dot"></div>
              <span>ChatGPT</span>
            </button>
            <button class="style-opt" :class="{ active: store.style === 'mdn' }" @click="setStyle('mdn')">
              <div class="style-icon mdn-dot"></div>
              <span>MDN</span>
            </button>
            <div style="width:100%; height:1px; background:rgba(128,128,128,0.1); margin:4px 0"></div>
            <button class="style-opt" :class="{ active: store.style === 'vscode' }" @click="setStyle('vscode')">
              <div class="style-icon vscode-dot"></div>
              <span>VS Code</span>
              <span class="pro-tag">Pro</span>
            </button>
            <button class="style-opt" :class="{ active: store.style === 'terminal' }" @click="setStyle('terminal')">
              <div class="style-icon terminal-dot"></div>
              <span>Terminal</span>
              <span class="pro-tag">Pro</span>
            </button>
            <button class="style-opt" :class="{ active: store.style === 'idea' }" @click="setStyle('idea')">
              <div class="style-icon idea-dot"></div>
              <span>IDEA</span>
              <span class="pro-tag">Pro</span>
            </button>
            <button class="style-opt" :class="{ active: store.style === 'webstorm' }" @click="setStyle('webstorm')">
              <div class="style-icon webstorm-dot"></div>
              <span>WebStorm</span>
              <span class="pro-tag">Pro</span>
            </button>
            <button class="style-opt" :class="{ active: store.style === 'juejin' }" @click="setStyle('juejin')">
              <div class="style-icon juejin-dot"></div>
              <span>掘金</span>
              <span class="pro-tag">Pro</span>
            </button>
            <button class="style-opt" :class="{ active: store.style === 'stackoverflow' }" @click="setStyle('stackoverflow')">
              <div class="style-icon stackoverflow-dot"></div>
              <span>Stack Overflow</span>
              <span class="pro-tag">Pro</span>
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
import type { StyleName } from '@/types';

const store = useAppStore();
const isCollapsed = ref(false);
let peekTimer: any = null;

function setStyle(style: StyleName) {
  const proStyles: StyleName[] = ['vscode', 'terminal', 'idea', 'webstorm', 'juejin', 'stackoverflow'];
  
  if (proStyles.includes(style) && !store.isPro) {
    if (store.previewTimer > 0) return;
    const originalStyle = store.style;
    store.style = style;
    store.showSettings = false; 
    store.previewTimer = 5;
    store.showToast('✨ 正在为您开启 Pro 风格预览', 'preview');
    
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
  const saved = localStorage.getItem('deep_reader_collapsed_sections');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.appearance !== undefined) isCollapsed.value = parsed.appearance;
    } catch (e) {}
  }
});

watch(isCollapsed, (val) => {
  const saved = localStorage.getItem('deep_reader_collapsed_sections') || '{}';
  try {
    const parsed = JSON.parse(saved);
    parsed.appearance = val;
    localStorage.setItem('deep_reader_collapsed_sections', JSON.stringify(parsed));
  } catch (e) {}
});
</script>
