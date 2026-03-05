<template>
  <div class="advanced-sub-group">
    <div class="sub-group-title">
       <icon-material-symbols-visibility-off />
       <span>老板键 (Boss Key)</span>
    </div>
    <div class="setting-item no-border">
      <div class="setting-control boss-key-manager">
        <div class="key-tags">
          <div v-for="(key, idx) in store.settings.bossKeys" :key="idx" class="key-tag" @click="removeBossKey(idx)">
            {{ key === ' ' ? 'Space' : key }}
            <icon-material-symbols-close style="font-size:12px" />
          </div>
          <div v-if="store.settings.bossKeys.length < 3" class="key-tag key-add" :class="{ 'is-listening': isListeningKey }" @click="startListenKey">
            {{ isListeningKey ? '输入中...' : '+ 录制新按键' }}
          </div>
        </div>
      </div>
    </div>
    <div class="setting-item no-border" style="margin-top: 8px; padding-top: 12px; border-top: 1px dashed rgba(128,128,128,0.1);">
      <div class="setting-label">
        <span style="font-size: 12px; color: var(--text-secondary);">鼠标左键连击三下触发</span>
      </div>
      <div class="setting-control">
        <label class="toggle-switch">
          <input type="checkbox" v-model="store.settings.tripleClickBossKey">
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <div class="setting-item no-border" style="flex-direction: column; align-items: stretch; margin-top: 8px; padding-top: 12px; border-top: 1px dashed rgba(128,128,128,0.1);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div class="setting-label">
           <span style="font-size: 12px; color: var(--text-secondary);">切换目标选择</span>
        </div>
        <div class="setting-control">
          <select v-model="store.settings.bossKeyTarget" class="custom-select" style="width: 140px; padding: 4px 8px; font-size: 12px;">
             <option value="template">默认模板对话</option>
             <option value="specific">指定已有AI对话</option>
             <option value="random">随机已有AI对话</option>
          </select>
        </div>
      </div>
      <div v-if="store.settings.bossKeyTarget === 'specific'" style="display: flex; justify-content: flex-end; margin-top: 8px;">
         <select v-model="store.settings.bossKeySpecificTargetId" class="custom-select" style="width: 100%; padding: 6px 8px; font-size: 12px;">
            <option value="">请选择...</option>
            <option v-for="ai in aiConversations" :key="ai.id" :value="ai.id">{{ ai.displayName || ai.name }}</option>
         </select>
      </div>
    </div>
    <div class="setting-item no-border" style="flex-direction: column; align-items: stretch; margin-top: 8px; padding-top: 12px; border-top: 1px dashed rgba(128,128,128,0.1); gap: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div class="setting-label">
          <span style="font-size: 12px; color: var(--text-secondary);">切换后对话流式呈现</span>
        </div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" v-model="store.settings.bossKeyStreamOutput">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      <div style="font-size: 11px; color: var(--text-muted); line-height: 1.4;">
        仅在 Gemini / ChatGPT 等 AI 对话类风格下生效
      </div>
    </div>
    
    <div v-if="store.settings.bossKeyStreamOutput" class="setting-item no-border" style="flex-direction: column; align-items: stretch; padding-top: 8px; gap: 6px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 12px; color: var(--text-secondary);">流式起始字符数</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input
            type="number"
            v-model.number="store.settings.bossKeyStreamStartChars"
            min="50"
            max="2000"
            step="50"
            class="custom-input-mini"
          />
          <span style="font-size: 11px; color: var(--text-muted);">字</span>
        </div>
      </div>
      <div style="font-size: 11px; color: var(--text-muted); line-height: 1.5;">
        建议不超过目标对话单条回复的实际字数，否则无内容可打字
      </div>
    </div>
    
    <div v-if="store.settings.bossKeyStreamOutput" class="setting-item no-border" style="flex-direction: column; align-items: stretch; padding-top: 8px; gap: 8px; border-top: 1px dashed rgba(128,128,128,0.1); margin-top: 4px;">
      <span style="font-size: 12px; color: var(--text-secondary);">打字起始点选取</span>
      <div class="turn-mode-options">
        <label class="turn-option" :class="{ active: store.settings.bossKeyStreamTurn !== 'last' }" @click="store.settings.bossKeyStreamTurn = 'first'">
          <div class="turn-option-title">🎯 首屏模式 (首轮开始)</div>
          <div class="turn-option-desc">从头开始打字，无需滚动。适合快速进入工作状态。</div>
        </label>
        <label class="turn-option" :class="{ active: store.settings.bossKeyStreamTurn === 'last' }" @click="store.settings.bossKeyStreamTurn = 'last'">
          <div class="turn-option-title">💼 深度模式 (末轮开始)</div>
          <div class="turn-option-desc">自动滚到底部，模拟追问环节。内容丰富，氛围感更强。</div>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '@/store/appStore';

const store = useAppStore();
const isListeningKey = ref(false);

const aiConversations = computed(() => {
   return store.novels.filter(n => n.type === 'fake' || n.type === 'ai');
});

function startListenKey() {
  isListeningKey.value = true;
  window.addEventListener('keydown', captureBossKey, { once: true });
}

function captureBossKey(e: KeyboardEvent) {
  e.preventDefault();
  isListeningKey.value = false;
  const key = e.key;
  // Escape 键保留给系统关闭弹窗使用，不允许设为老板键
  if (key === 'Escape') return;
  if (!store.settings.bossKeys.includes(key)) {
    store.settings.bossKeys.push(key);
  }
}

function removeBossKey(idx: number) {
  store.settings.bossKeys.splice(idx, 1);
}
</script>

<style scoped lang="less">
.custom-select {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: var(--radius-md);
  padding: 4px 10px;
  font-size: 12px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  cursor: pointer;
  font-family: inherit;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 32px;

  &:hover {
    border-color: var(--text-muted);
    background-color: var(--bg-primary);
  }

  &:focus {
    border-color: var(--accent);
    background: var(--bg-primary);
    box-shadow: 0 0 0 2px rgba(var(--accent-rgb, 100,181,246), 0.15);
  }

  option {
    background: var(--bg-surface);
    color: var(--text-primary);
    padding: 8px;
  }
}

.custom-input-mini {
  width: 80px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: var(--radius-md);
  padding: 5px 10px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  text-align: center;
  outline: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: var(--text-muted);
    background-color: var(--bg-primary);
  }

  &:focus {
    border-color: var(--accent);
    background: var(--bg-primary);
    box-shadow: 0 0 0 2px rgba(var(--accent-rgb, 100,181,246), 0.15);
  }

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  appearance: textfield;
}

.turn-mode-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.turn-option {
  display: block;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;

  &:hover {
    border-color: var(--accent);
    background: rgba(var(--accent-rgb, 100,181,246), 0.04);
  }

  &.active {
    border-color: var(--accent);
    background: rgba(var(--accent-rgb, 100,181,246), 0.08);
  }
}

.turn-option-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 3px;
}

.turn-option-desc {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.5;
}
</style>
