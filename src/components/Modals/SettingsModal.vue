<template>
  <div class="modal-overlay" v-if="store.showSettings" @click.self="store.showSettings = false">
    <div 
      class="modal-container" 
      :class="{ 'is-transparent': isPeeking }"
    >
      <div class="modal-header">
        <div v-if="activeSubModal" class="sub-header-nav" @click="closeSubModal">
          <icon-material-symbols-arrow-back />
          <h2>{{ subModalTitle }}</h2>
        </div>
        <h2 v-else>设置</h2>
        <button class="icon-btn modal-close" @click="store.showSettings = false">
          <icon-material-symbols-close />
        </button>
      </div>
      <div class="modal-body settings-body-container">
        <transition :name="transitionName" mode="out-in">
          <div v-if="!activeSubModal" class="settings-main-view" key="main">
            <AppearanceTab />
            
            <div class="settings-section">
              <div class="section-header interactive-row" @click="openSubModal('reading', '排版配置')">
                <div class="header-with-tip">
                  <h3>排版配置</h3>
                  <span class="advanced-tip">{{ vibeReadingText }}</span>
                </div>
                <icon-material-symbols-settings class="collapse-icon" />
              </div>
            </div>

            <div class="settings-section advanced-section">
              <div class="section-header interactive-row" @click="openSubModal('advanced', '高级与实验性功能')">
                <div class="header-with-tip">
                  <h3>高级与实验性功能</h3>
                  <span class="advanced-tip">含编码、快捷键、反馈等</span>
                </div>
                <icon-material-symbols-settings class="collapse-icon" />
              </div>
            </div>

            <ProTab />
          </div>
          
          <div v-else-if="activeSubModal === 'reading'" class="settings-sub-view" key="reading">
            <ReadingTab />
          </div>
          
          <div v-else-if="activeSubModal === 'advanced'" class="settings-sub-view" key="advanced">
            <AdvancedTab />
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useAppStore } from '@/store/appStore';

import AppearanceTab from './Settings/AppearanceTab.vue';
import ReadingTab from './Settings/ReadingTab.vue';
import ProTab from './Settings/ProTab.vue';
import AdvancedTab from './Settings/AdvancedTab.vue';

const store = useAppStore();
const isPeeking = ref(false);

const activeSubModal = ref<string | null>(localStorage.getItem('find_deep_last_sub_modal') || null);
const subModalTitle = ref(localStorage.getItem('find_deep_last_sub_title') || '');

watch(activeSubModal, (val) => {
  if (val) {
    localStorage.setItem('find_deep_last_sub_modal', val);
    localStorage.setItem('find_deep_last_sub_title', subModalTitle.value);
  } else {
    localStorage.removeItem('find_deep_last_sub_modal');
    localStorage.removeItem('find_deep_last_sub_title');
  }
});
const transitionName = ref('slide-left');
const vibeReadingText = ref('Vibe Reading');

let typeTimer: any = null;
const fullText = "Vibe Reading";

function openSubModal(id: string, title: string) {
  transitionName.value = 'slide-left';
  subModalTitle.value = title;
  activeSubModal.value = id;
}

function closeSubModal() {
  transitionName.value = 'slide-right';
  activeSubModal.value = null;
}

watch(() => store.showSettings, (newVal) => {
  if (newVal) {
    isPeeking.value = false;
    
    if (typeTimer) {
      clearInterval(typeTimer);
      clearTimeout(typeTimer);
    }
    
    if (store.settings.hasSeenVibeReadingTip) {
      vibeReadingText.value = fullText;
    } else {
      store.settings.hasSeenVibeReadingTip = true;
      vibeReadingText.value = '._';
      let blinkCount = 0;
      
      const blinkTimer = setInterval(() => {
        if (!store.showSettings) {
          clearInterval(blinkTimer);
          return;
        }
        blinkCount++;
        vibeReadingText.value = blinkCount % 2 === 0 ? '._' : '.';
        if (blinkCount >= 4) { // 2 seconds (4 * 500ms)
          clearInterval(blinkTimer);
          if (!store.showSettings) return;
          
          let i = 0;
          const typeNext = () => {
            if (!store.showSettings) return;
            if (i <= fullText.length) {
              vibeReadingText.value = fullText.slice(0, i) + (i < fullText.length ? '_' : '');
              i++;
              typeTimer = setTimeout(typeNext, 40 + Math.random() * 40);
            }
          };
          typeTimer = setTimeout(typeNext, 100);
        }
      }, 500);
      typeTimer = blinkTimer;
    }
    if (store.autoExpandAdvanced) {
      activeSubModal.value = 'advanced';
      subModalTitle.value = '高级与实验性功能';
      store.autoExpandAdvanced = false;
    } else if (store.autoExpandReading) {
      activeSubModal.value = 'reading';
      subModalTitle.value = '排版配置';
      store.autoExpandReading = false;
    }
  } else {
    if (typeTimer) {
      clearInterval(typeTimer);
      clearTimeout(typeTimer);
    }
  }
});

watch(() => store.autoExpandReading, (newVal) => {
  if (newVal && store.showSettings) {
    activeSubModal.value = 'reading';
    subModalTitle.value = '排版配置';
    store.autoExpandReading = false;
  }
});

watch(() => store.autoExpandAdvanced, (newVal) => {
  if (newVal && store.showSettings) {
    activeSubModal.value = 'advanced';
    subModalTitle.value = '高级与实验性功能';
    store.autoExpandAdvanced = false;
  }
});

</script>

<style lang="less">
.settings-section {
  margin-bottom: 24px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;
    margin-bottom: 12px;
    padding: 2px 0;
    
    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .collapse-icon {
      font-size: 20px;
      color: var(--text-muted);
      transition: transform 0.2s ease;
    }
    
    &:hover .collapse-icon {
      color: var(--text-secondary);
    }
  }

  &.is-collapsed {
    .collapse-icon {
      transform: rotate(-90deg);
    }
    .section-body {
      display: none;
    }
  }
}

.settings-main-view {
  display: flex;
  flex-direction: column;

  > .settings-section {
    margin-bottom: 0;
    padding: 18px 0;
    border-bottom: 1px solid rgba(128, 128, 128, 0.1);
    
    &:first-child {
      padding-top: 0;
    }

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
  }
}

.modal-container {
  // Use a smoother "Expo Out" curve for a more fluid feel
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), 
              opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  
  &.is-transparent {
    // User requested to remove transparency during preview, 
    // but keeping the class for potential other uses (like manual Peek button if added later)
    // or just disabling it for now.
    pointer-events: none;
  }
}

.sub-header-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.8;
  }

  .material-symbols-outlined {
    font-size: 20px;
    color: var(--text-muted);
  }
}

.settings-body-container {
  position: relative;
  overflow-x: hidden;
}

.interactive-row {
  padding: 10px 12px !important;
  margin: 0 -12px !important;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--bg-surface-hover);
    .collapse-icon {
      color: var(--accent);
    }
  }
  
  .collapse-icon {
    transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), color 0.2s;
  }
  &:hover .collapse-icon {
    transform: rotate(45deg);
  }
}

/* Slide Transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.slide-left-enter-from,
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.slide-left-leave-to,
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}


.achievement-badge {
  font-size: 11px;
  background: linear-gradient(135deg, #fbbc05, #ea4335);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.selector-group {
  display: flex;
  gap: 8px;
}

.boss-key-manager {
  .key-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .key-tag {
    background: var(--bg-surface);
    border: 1px solid var(--border-color);
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-family: monospace;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background: var(--bg-input);
      border-color: var(--accent-pink);
      color: var(--accent-pink);
    }
  }

  .key-add {
    border-style: dashed;
    color: var(--text-secondary);
    
    &:hover {
      border-color: var(--accent);
      color: var(--accent);
      background: transparent;
    }
    
    &.is-listening {
      background: var(--bg-surface-active);
      border-color: var(--accent);
      border-style: solid;
      color: var(--accent);
      animation: pulse 1s infinite;
    }
  }
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

.mini-switch-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  margin-left: 12px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s;
  user-select: none;

  &:hover {
    background-color: var(--bg-surface-hover);
  }

  span {
    font-size: 11px;
    color: var(--text-muted);
  }
}

.mini-switch {
  width: 24px;
  height: 12px;
  background-color: var(--border-color);
  border-radius: 6px;
  position: relative;
  transition: background-color 0.3s;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 8px;
    height: 8px;
    background-color: #fff;
    border-radius: 50%;
    transition: transform 0.3s;
  }

  &.active {
    background-color: var(--accent);
    
    &::after {
      transform: translateX(12px);
    }
  }
}


.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(128, 128, 128, 0.15);
  flex-wrap: wrap;
  gap: 8px;

  &:last-child {
    border-bottom: none;
  }
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
  font-size: 14px;

  .material-symbols-outlined {
    font-size: 20px;
    color: var(--text-secondary);
  }
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-btn {
  padding: 8px 20px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  background: transparent;
  color: var(--accent);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition-speed);
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background-color: rgba(138, 180, 248, 0.1);
    border-color: var(--accent);
  }

  &.danger {
    color: var(--accent-pink);

    &:hover {
      background-color: rgba(242, 139, 130, 0.1);
      border-color: var(--accent-pink);
    }
  }

  &.danger-filled {
    background-color: #f28b82;
    color: #fff;
    border: none;

    &:hover {
      background-color: #ea4335;
      transform: scale(1.02);
    }
    
    .material-symbols-outlined {
      color: #fff;
      font-size: 16px;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(100%);
    pointer-events: none;
  }
}

.label-with-desc {
  display: flex;
  flex-direction: column;
  gap: 2px;
  
  .desc-text {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: normal;
  }
}

.data-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
  margin-top: 8px;
}

.data-stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  padding: 12px;
  border-radius: var(--radius-md);
  text-align: center;
  
  .stat-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--accent);
  }
  
  .stat-label {
    font-size: 11px;
    color: var(--text-secondary);
    margin-top: 4px;
  }
}

.data-mgmt-item {
  flex-direction: column;
  align-items: flex-start !important;
}

.encoding-select {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface);
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  transition: border-color var(--transition-speed);

  &:focus {
    border-color: var(--accent);
  }
}

.theme-switch-group {
  display: flex;
  gap: 4px;
  background-color: var(--bg-surface);
  border-radius: var(--radius-xl);
  padding: 3px;
}

.theme-opt, .reading-mode-opt {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-xl);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition-speed);

  .material-symbols-outlined {
    font-size: 18px;
  }

  &.active {
    background-color: var(--accent);
    color: white;
  }

  &:not(.active):hover {
    background-color: var(--bg-surface-hover);
  }
}

.style-selector-wrap {
  width: 100%;
  justify-content: flex-end;
}

.style-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.style-opt {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-xl);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition-speed);

  &.active {
    border-color: var(--accent);
    color: var(--accent);
    background-color: rgba(138, 180, 248, 0.08);
  }

  &:not(.active):hover {
    border-color: var(--border-color-light);
    background-color: var(--bg-surface-hover);
  }
}

.style-icon {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;


}

.tag {
  margin-left: auto;
  font-size: 10px;
  color: #fff;
  padding: 2px 7px;
  border-radius: 20px;
  font-weight: 800;
  letter-spacing: 0.2px;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  transform: translateY(-0.5px);
  user-select: none;
}

.tag-beta {
  background: var(--accent);
}

.tag-free {
  background: linear-gradient(135deg, #10a37f, #1a7f64);
  box-shadow: 0 1px 3px rgba(16, 163, 127, 0.2);
}

.tag-pro {
  background: linear-gradient(135deg, #fbbc05, #ea4335);
  box-shadow: 0 1px 3px rgba(234, 67, 53, 0.2);
}

.slider {
  width: 120px;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: var(--border-color);
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
    transition: transform 0.15s;

    &:hover { transform: scale(1.2); }
  }
}

.saved-novels-list {
  width: 100%;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.saved-novel-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background-color: var(--bg-surface);
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-speed);

  &:hover {
    background-color: var(--bg-surface-hover);
  }
}

.novel-item-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  cursor: pointer;

  .material-symbols-outlined {
    font-size: 20px;
    color: var(--accent);
    flex-shrink: 0;
  }
}

.novel-item-name {
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.novel-item-size {
  font-size: 12px;
  color: var(--text-muted);
  margin-left: 4px;
  flex-shrink: 0;
}

.novel-delete-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-speed);

  &:hover {
    background-color: rgba(242, 139, 130, 0.15);
    color: var(--accent-pink);
  }

  .material-symbols-outlined {
    font-size: 16px;
  }
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
  font-size: 13px;
}

/* Feedback Form */
.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feedback-type-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;

  .type-tag {
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-color);
    background: transparent;
    color: var(--text-secondary);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--bg-surface-hover);
      border-color: var(--border-color-light);
    }

    &.active {
      background: var(--bg-surface-active);
      border-color: var(--accent);
      color: var(--text-primary);
      font-weight: 500;
    }
  }
}

.feedback-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--bg-surface);
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  outline: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: var(--text-muted);
    background-color: var(--bg-input);
  }

  &:focus {
    border-color: var(--accent);
    background-color: var(--bg-primary);
    box-shadow: 0 0 0 2px rgba(var(--accent-rgb, 100,181,246), 0.15);
  }
  &::placeholder { color: var(--text-muted); }
}

.feedback-contact {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--bg-surface);
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: var(--text-muted);
    background-color: var(--bg-input);
  }

  &:focus {
    border-color: var(--accent);
    background-color: var(--bg-primary);
    box-shadow: 0 0 0 2px rgba(var(--accent-rgb, 100,181,246), 0.15);
  }
  &::placeholder { color: var(--text-muted); }
}

.feedback-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feedback-status {
  font-size: 13px;
  color: var(--text-muted);
  transition: color 0.3s;

  &.success { color: var(--accent-green); }
  &.error { color: var(--accent-pink); }
}

.setting-control-col {
  flex-direction: column;
  align-items: stretch;
  width: auto;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preset-btns {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.preset-btn {
  padding: 4px 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition-speed);

  &:hover {
    border-color: var(--accent);
    color: var(--accent);
    background-color: rgba(138, 180, 248, 0.06);
  }

  &.active {
    border-color: var(--accent);
    color: var(--accent);
    background-color: rgba(138, 180, 248, 0.12);
  }
}

/* Shared Header Tip Styles */
.header-with-tip {
  display: flex;
  align-items: center;
  gap: 8px;
}

.advanced-tip {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: normal;
  background: var(--bg-surface);
  padding: 2px 8px;
  border-radius: 10px;
}


.advanced-sub-group {
  margin-top: 16px;
  padding: 12px;
  background: rgba(128,128,128,0.03);
  border-radius: 12px;
  border: 1px solid rgba(128,128,128,0.08);

  .sub-group-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    .material-symbols-outlined {
      font-size: 16px;
    }
  }
  
  .setting-item.no-border {
    border-bottom: none;
    padding: 6px 0;
  }
}

.name-input-small {
  width: 120px;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: var(--text-muted);
    background-color: var(--bg-surface-hover);
  }

  &:focus {
    border-color: var(--accent);
    background-color: var(--bg-primary);
    box-shadow: 0 0 0 2px rgba(var(--accent-rgb, 100,181,246), 0.15);
  }
}

/* Custom CSS Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(128, 128, 128, 0.3);
    transition: .3s cubic-bezier(0.4, 0.0, 0.2, 1);
    border-radius: 20px;

    &:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 3px;
      bottom: 3px;
      background-color: #fff;
      transition: .3s cubic-bezier(0.4, 0.0, 0.2, 1);
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
  }

  input:checked + .toggle-slider {
    background-color: var(--accent);
  }

  input:focus + .toggle-slider {
    box-shadow: 0 0 1px var(--accent);
  }

  input:checked + .toggle-slider:before {
    transform: translateX(16px);
  }
}

.mini-feedback {
  .feedback-type-selector {
    margin-bottom: 8px;
    .type-tag { padding: 4px 10px; font-size: 11px; }
  }
  .feedback-textarea {
    min-height: 60px;
    padding: 8px;
    font-size: 12px;
  }
  .feedback-actions {
    width: 100%;
    margin-top: 8px;
    .feedback-submit-btn { padding: 4px 12px; font-size: 12px; }
  }
  .feedback-status {
    margin-top: 8px;
    font-size: 11px;
    text-align: right;
    &.error { color: var(--accent-pink); }
    &.success { color: var(--accent-green, #34a853); }
  }
}

.danger-text {
  color: var(--accent-pink);
  background: transparent;
  border: none;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  &:hover { background: rgba(242, 139, 130, 0.1); }
}

.humor-footer {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px dashed rgba(128,128,128,0.1);
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;

  span {
    display: block;
    padding: 6px 12px;
    margin: 0;
    font-family: 'Outfit', 'Playfair Display', serif;
    font-style: italic;
    font-size: 13px;
    color: var(--text-muted);
    opacity: 0.5;
    transition: 
      opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1),
      transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1),
      color 1.5s ease,
      filter 1.5s ease;
    cursor: default;
    user-select: none;
    border-radius: 4px;
    will-change: transform, opacity, filter;

    &:hover {
      opacity: 1;
      transform: translateY(-2px) scale(1.04);
      font-weight: 800;
      color: transparent;
      background: linear-gradient(110deg, #ffd700 0%, #fff8dc 20%, #ff8c00 40%, #ffdf00 60%, #fff8dc 80%, #ffd700 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      background-clip: text;
      animation: humor-shine 2s linear infinite;
      filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 16px rgba(255, 140, 0, 0.4));
    }

    &.achievement-highlight {
      opacity: 1;
      font-weight: 800;
      color: transparent;
      background: linear-gradient(110deg, #ffdf00 0%, #ffffff 20%, #ffa500 40%, #ffd700 60%, #ffffff 80%, #ffdf00 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      background-clip: text;
      animation: humor-shine 1.5s linear infinite;
      transform: scale(1.08) translateY(-2px);
      letter-spacing: 0.5px;
      filter: drop-shadow(0 0 15px rgba(255, 223, 0, 1)) drop-shadow(0 0 30px rgba(255, 165, 0, 0.7));
    }

    &.status-wlb:hover {
      background: linear-gradient(135deg, #a8e063 0%, #56ab2f 100%);
      -webkit-background-clip: text;
      background-clip: text;
    }

    &.power-saving:hover {
      background: linear-gradient(135deg, #fceabb 0%, #f8b500 100%);
      -webkit-background-clip: text;
      background-clip: text;
    }

    &.self-recharge:hover {
      background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%);
      -webkit-background-clip: text;
      background-clip: text;
    }

    &.res-optimized:hover {
      background: linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%);
      -webkit-background-clip: text;
      background-clip: text;
    }

    &.lazy-virtue:hover {
      background: linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%);
      -webkit-background-clip: text;
      background-clip: text;
    }
  }
}


@keyframes humor-shine {
  to {
    background-position: 200% center;
  }
}

.compliance-disclaimer {
  margin-top: 32px;
  opacity: 0.7; // 降低整体透明度，更低调
  transition: opacity 0.3s;
  
  &:hover {
    opacity: 1;
  }
  
  .disclaimer-content {
    font-size: 11px;
    line-height: 1.6;
    color: var(--text-muted);
    text-align: justify;
    padding: 0 4px;
  }
}
</style>
