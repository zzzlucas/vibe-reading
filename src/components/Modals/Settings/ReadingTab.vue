<template>
  <div class="settings-section">
    <div class="section-body">
      <div class="advanced-sub-group" style="margin-top: 0;">
        <div class="sub-group-title" style="cursor: pointer; justify-content: space-between; user-select: none;" @click="store.settings.basicSettingsCollapsed = !store.settings.basicSettingsCollapsed">
          <div style="display: flex; align-items: center; gap: 8px;">
            <icon-material-symbols-text-fields />
            <span>基础排版</span>
          </div>
          <icon-material-symbols-keyboard-arrow-down style="transition: transform 0.2s; color: var(--text-muted); font-size: 20px;" :style="{ transform: store.settings.basicSettingsCollapsed ? 'rotate(-90deg)' : 'rotate(0)' }" />
        </div>
        
        <div v-show="!store.settings.basicSettingsCollapsed" style="display: flex; flex-direction: column;">
          <div class="setting-item">
            <div class="setting-label">
              <icon-material-symbols-import-contacts />
              <span>阅读模式</span>
            </div>
            <div class="setting-control">
              <div class="theme-switch-group">
                <button class="reading-mode-opt" :class="{ active: store.settings.readingMode === 'page' }" @click="setReadingMode('page')">
                  <icon-material-symbols-view-agenda />
                  <span>翻页</span>
                </button>
                <button class="reading-mode-opt" :class="{ active: store.settings.readingMode === 'scroll' }" @click="setReadingMode('scroll')">
                  <icon-material-symbols-view-day />
                  <span>长文</span>
                </button>
              </div>
            </div>
          </div>
          
          <div class="setting-item">
            <div class="setting-label">
              <icon-material-symbols-text-fields />
              <span>字体大小</span>
            </div>
            <div class="setting-control">
              <input type="range" v-model.number="store.settings.fontSize" min="14" max="24" class="slider">
              <span>{{ store.settings.fontSize }}px</span>
            </div>
          </div>
          
          <div class="setting-item">
            <div class="setting-label">
              <icon-material-symbols-format-line-spacing />
              <span>行间距</span>
            </div>
            <div class="setting-control">
              <input type="range" v-model.number="lineHeight" min="14" max="28" class="slider">
              <span>{{ (lineHeight / 10).toFixed(1) }}</span>
            </div>
          </div>
          
          <div class="setting-item">
            <div class="setting-label">
              <icon-material-symbols-palette />
              <span>字体颜色</span>
            </div>
            <div class="setting-control color-control">
              <div class="color-badge" v-if="!store.settings.fontColor">跟随主题</div>
              <input type="color" v-model="pickerColor" class="color-picker-input">
              <button v-if="store.settings.fontColor" class="reset-link" @click="store.settings.fontColor = ''">恢复默认</button>
            </div>
          </div>
          
          <PageNavKeySettings />
          <EngineSettings />
        </div>
      </div>

      <div class="advanced-sub-group">
        <div class="sub-group-title" style="cursor: pointer; justify-content: space-between; user-select: none;" @click="store.settings.advancedSettingsCollapsed = !store.settings.advancedSettingsCollapsed">
          <div style="display: flex; align-items: center; gap: 8px;">
            <icon-material-symbols-auto-fix />
            <span>进阶排版</span>
          </div>
          <icon-material-symbols-keyboard-arrow-down style="transition: transform 0.2s; color: var(--text-muted); font-size: 20px;" :style="{ transform: store.settings.advancedSettingsCollapsed ? 'rotate(-90deg)' : 'rotate(0)' }" />
        </div>
        
        <div v-show="!store.settings.advancedSettingsCollapsed" style="display: flex; flex-direction: column;">
          <div class="setting-item">
            <div class="setting-label">
              <icon-material-symbols-keyboard-double-arrow-right />
              <div class="label-with-desc">
                <span>打字机模式</span>
                <span class="desc-text">仅在阅读模式的翻页/跳转时触发，刷新与切换会话时不打字以保持高效</span>
              </div>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" v-model="store.settings.typewriterMode">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          <div class="setting-item" v-if="store.settings.typewriterMode">
            <div class="setting-label">
              <icon-material-symbols-speed />
              <div class="label-with-desc">
                <span>打字速度 (ms)</span>
                <span class="desc-text">越小越快，建议 20~80ms</span>
              </div>
            </div>
            <div class="setting-control">
              <input type="range" v-model.number="store.settings.typewriterSpeed" min="5" max="200" step="5" class="slider">
              <span>{{ store.settings.typewriterSpeed }}ms</span>
            </div>
          </div>

          <div class="setting-item bubble-settings-item">
            <div class="setting-label">
              <icon-material-symbols-chat-bubble-outline />
              <div class="label-with-desc">
                <span>用户气泡内容</span>
                <span class="desc-text">自定义阅读时上方提问气泡的文案</span>
              </div>
            </div>
            <div class="setting-control bubble-mode-control">
              <div class="segmented-control">
                <button class="segment-btn" :class="{ active: store.settings.userBubbleMode === 'default' }" @click="store.settings.userBubbleMode = 'default'">默认</button>
                <button class="segment-btn" :class="{ active: store.settings.userBubbleMode === 'random' }" @click="store.settings.userBubbleMode = 'random'">随机</button>
                <button class="segment-btn" :class="{ active: store.settings.userBubbleMode === 'template' }" @click="store.settings.userBubbleMode = 'template'">自定义</button>
              </div>
            </div>
          </div>

          <div class="setting-item sub-group-box" v-if="store.settings.userBubbleMode === 'template'">
            <div class="sub-group-header">
               <span class="sub-label">模板配置</span>
               <div class="var-list" v-pre>
                 <code>{{title}}</code> <code>{{page}}</code> <code>{{total}}</code> <code>{{time}}</code>
               </div>
            </div>
            <div class="template-edit-area">
              <input 
                type="text" 
                v-model="store.settings.userBubbleTemplate" 
                class="custom-text-input" 
                placeholder="输入模板文案..."
              />
              <div class="template-presets">
                <button v-for="t in presetTemplates" :key="t" @click="store.settings.userBubbleTemplate = t" class="preset-tag">
                  {{ t }}
                </button>
              </div>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-label">
               <icon-material-symbols-visibility />
               <div class="label-with-desc">
                 <span>界面元素显示</span>
                 <span class="desc-text">控制顶部作品名与正文第一行章节名的可见性</span>
               </div>
            </div>
            <div class="setting-control visibility-settings">
              <label class="check-opt">
                <input type="checkbox" v-model="store.settings.showNovelTitle">
                <span>作品标题</span>
              </label>
              <label class="check-opt" style="margin-left: 12px;">
                <input type="checkbox" v-model="store.settings.showChapterName">
                <span>正文第一行名</span>
              </label>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-label">
              <span>段落合并开关</span>
            </div>
            <div class="setting-control" style="gap: 12px;">
              <div v-if="store.settings.secondaryRenderMergeParagraphs" style="display: flex; align-items: center; gap: 6px;">
                <span class="desc-text" style="font-size: 11px;">最大段数</span>
                <input type="number" v-model.number="store.settings.secondaryRenderMergeCount" min="2" max="10" class="custom-text-input mini" style="width: 54px; padding: 4px; text-align: center; height: 28px; font-size: 13px;">
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="store.settings.secondaryRenderMergeParagraphs">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-label">
              <span>缩进调整</span>
            </div>
            <div class="setting-control">
               <select v-model.number="store.settings.secondaryRenderIndent" class="custom-select-alt" style="width: 140px; padding: 4px 10px; font-size: 12px;">
                  <option :value="0">无缩进 (顶格)</option>
                  <option :value="2">2字符缩进</option>
                  <option :value="4">4字符缩进</option>
                  <option :value="8">8字符长缩进</option>
               </select>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-label">
              <span>深度排版内容辅助</span>
            </div>
            <div class="setting-control">
               <select v-model="store.settings.secondaryRenderObfuscationMode" class="custom-text-input" style="width: 140px; padding: 2px 8px; font-size: 11px; height: 26px;">
                  <option value="none">原生排版 (无额外辅助)</option>
                  <option value="log">Log 日志模式</option>
                  <option value="json">JSON 数据模式</option>
                  <option value="markdown_report">Markdown 报告风</option>
                  <option value="translation">防机翻翻译对照</option>
               </select>
            </div>
          </div>

          <div class="setting-item" style="flex-direction: column; align-items: stretch; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div class="setting-label">
                <span>标点符号替换/擦除</span>
              </div>
              <div class="setting-control">
                <label class="toggle-switch">
                  <input type="checkbox" v-model="store.settings.secondaryRenderEnablePunctuation">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            <div v-if="store.settings.secondaryRenderEnablePunctuation" style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap; background: rgba(128,128,128,0.05); padding: 8px 10px; border-radius: 6px;">
              <label class="check-opt mini-check"><input type="checkbox" v-model="store.settings.secondaryRenderRemovePunctuation" value="all"><span>全部</span></label>
              <label class="check-opt mini-check"><input type="checkbox" v-model="store.settings.secondaryRenderRemovePunctuation" value="comma"><span>逗号</span></label>
              <label class="check-opt mini-check"><input type="checkbox" v-model="store.settings.secondaryRenderRemovePunctuation" value="period"><span>句号</span></label>
              <label class="check-opt mini-check"><input type="checkbox" v-model="store.settings.secondaryRenderRemovePunctuation" value="quote"><span>引号</span></label>
              <label class="check-opt mini-check"><input type="checkbox" v-model="store.settings.secondaryRenderRemovePunctuation" value="exclamation"><span>感叹号</span></label>
              <label class="check-opt mini-check"><input type="checkbox" v-model="store.settings.secondaryRenderRemovePunctuation" value="question"><span>问号</span></label>
              <label class="check-opt mini-check"><input type="checkbox" v-model="store.settings.secondaryRenderRemovePunctuation" value="ellipsis"><span>省略号</span></label>
            </div>
          </div>

          <div class="setting-item no-border" style="flex-direction: column; align-items: stretch; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div class="setting-label">
                <span>私有字符替换字典</span>
              </div>
              <div class="setting-control">
                <label class="toggle-switch">
                  <input type="checkbox" v-model="store.settings.secondaryRenderEnableReplace">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <div v-if="store.settings.secondaryRenderEnableReplace">
              <textarea v-model="store.settings.secondaryRenderReplaceDict" class="custom-textarea" rows="3" placeholder="张三->罗某&#10;李四->施瓦辛格" style="font-size: 11px; padding: 6px 8px;"></textarea>
            </div>
          </div>
        </div>
      </div>


      <BossKeySettings />
      <SampleChatSettings />
      
      <div class="advanced-sub-group">
        <div class="sub-group-title">
          <icon-material-symbols-side-navigation />
          <span>展示侧边栏 (右侧)</span>
        </div>
        <div class="setting-item no-border">
          <div class="setting-label">
            <div class="label-with-desc">
              <span>开启侧边栏辅助</span>
              <span class="desc-text">在右侧固定显示一些“工作相关”的内容面板，增强沉浸感</span>
            </div>
          </div>
          <div class="setting-control">
            <label class="toggle-switch">
               <input type="checkbox" v-model="store.settings.showFakeSidebar">
               <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div class="setting-item no-border" v-if="store.settings.showFakeSidebar" style="flex-direction: column; align-items: stretch; border-top: 1px dashed rgba(128,128,128,0.1); margin-top: 8px; padding-top: 12px;">
           <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 13px; color: var(--text-primary); opacity: 0.8;">侧边栏内容模式</span>
              <div class="segmented-control mini">
                 <button class="segment-btn" :class="{ active: store.settings.fakeSidebarMode === 'random_it' }" @click="store.settings.fakeSidebarMode = 'random_it'">IT研发类</button>
                 <button class="segment-btn" :class="{ active: store.settings.fakeSidebarMode === 'random_design' }" @click="store.settings.fakeSidebarMode = 'random_design'">产品设计类</button>
                 <button class="segment-btn" :class="{ active: store.settings.fakeSidebarMode === 'random_general' }" @click="store.settings.fakeSidebarMode = 'random_general'">职场通用类</button>
                 <button class="segment-btn" :class="{ active: store.settings.fakeSidebarMode === 'custom' }" @click="store.settings.fakeSidebarMode = 'custom'">自定义</button>
              </div>
           </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
               <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 13px; color: var(--text-primary); opacity: 0.8;">列表条数随长度增长</span>
                  <div class="info-tip-trigger">
                    <icon-material-symbols-info-outline style="font-size: 14px; opacity: 0.5;" />
                    <div class="info-tip-content">对话轮数越多，侧边栏显示的工作内容越充实（模拟工作积压感）</div>
                  </div>
               </div>
               <label class="toggle-switch mini">
                  <input type="checkbox" v-model="store.settings.fakeSidebarAutoAdjustCount">
                  <span class="toggle-slider"></span>
               </label>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
               <span style="font-size: 13px; color: var(--text-primary); opacity: 0.8;">基础列表条数</span>
               <div style="display: flex; align-items: center; gap: 8px;">
                  <input type="range" v-model.number="store.settings.fakeSidebarItemCount" min="5" max="40" step="1" class="slider" style="width: 100px;">
                  <span style="font-size: 12px; color: var(--text-secondary); width: 45px; text-align: right; display: flex; align-items: center; justify-content: flex-end; gap: 2px;">
                    {{ store.settings.fakeSidebarItemCount || 15 }}
                    <span v-if="store.settings.fakeSidebarAutoAdjustCount" style="color: var(--accent); font-weight: bold; font-size: 10px;">+增量</span>
                  </span>
               </div>
            </div>
           <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 13px; color: var(--text-primary); opacity: 0.8;">适用对话种类</span>
              <div style="display: flex; gap: 12px;">
                 <label class="check-opt mini-check">
                    <input type="checkbox" :checked="(store.settings.fakeSidebarShowForTypes || ['novel','dummy']).includes('novel')" @change="toggleFakeSidebarType('novel')">
                    <span>作品阅读</span>
                 </label>
                 <label class="check-opt mini-check">
                    <input type="checkbox" :checked="(store.settings.fakeSidebarShowForTypes || ['novel','dummy']).includes('dummy')" @change="toggleFakeSidebarType('dummy')">
                    <span>预设对话</span>
                 </label>
                 <label class="check-opt mini-check">
                    <input type="checkbox" :checked="(store.settings.fakeSidebarShowForTypes || ['novel','dummy']).includes('ai')" @change="toggleFakeSidebarType('ai')">
                    <span>AI对话</span>
                 </label>
              </div>
           </div>
           
           <div class="fake-sidebar-config-area">
             <template v-if="store.settings.fakeSidebarMode === 'random_it' || store.settings.fakeSidebarMode === 'random_general' || store.settings.fakeSidebarMode === 'random_design'">
                <div class="random-pool-info" style="display: flex; justify-content: space-between;">
                   当前使用 100+ 条{{ store.settings.fakeSidebarMode === 'random_it' ? '工作/技术' : (store.settings.fakeSidebarMode === 'random_design' ? '产品设计' : '职场通用') }}相关文案
                   <button class="action-link-btn" @click="shuffleFakeSidebar" style="flex-shrink: 0;">刷新随机预览</button>
                </div>
             </template>
             <template v-else>
               <textarea 
                 v-model="store.settings.fakeSidebarContent" 
                 class="custom-textarea" 
                 placeholder="每行一条内容，支持 [TITLE] 开头作为加粗标题..."
                 rows="3"
               ></textarea>
             </template>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/store/appStore';
import PageNavKeySettings from './Advanced/PageNavKeySettings.vue';
import EngineSettings from './Advanced/EngineSettings.vue';
import BossKeySettings from './Advanced/BossKeySettings.vue';
import SampleChatSettings from './Advanced/SampleChatSettings.vue';

const store = useAppStore();

const pickerColor = computed({
  get: () => store.settings.fontColor || getThemeDefaultColor(),
  set: (val) => { store.settings.fontColor = val; }
});

function getThemeDefaultColor() {
  const isDark = store.theme === 'dark';
  const s = store.style;
  if (s === 'terminal') return isDark ? '#16c60c' : '#000000';
  if (s === 'gemini') return isDark ? '#e3e3e3' : '#1f1f1f';
  if (s === 'chatgpt') return isDark ? '#ececf1' : '#343541';
  if (s === 'vscode') return isDark ? '#cccccc' : '#3b3b3b';
  if (s === 'idea' || s === 'webstorm') return isDark ? '#a9b7c6' : '#000000';
  if (s === 'juejin') return isDark ? '#e5e6eb' : '#1d2129';
  if (s === 'mdn') return isDark ? '#fbfbfe' : '#15141a';
  if (s === 'stackoverflow') return isDark ? '#e3e6e8' : '#242729';
  return isDark ? '#ffffff' : '#000000';
}

const lineHeight = computed({
  get: () => Math.round(store.settings.lineHeight * 10),
  set: (val: number) => { store.settings.lineHeight = val / 10; }
});

const presetTemplates = [
  '{{title}} - P{{page}}',
  '正在研读：{{title}} (第{{page}}页/共{{total}}页)',
  '{{time}} | 阅读进度 {{page}}/{{total}}',
  '来自 {{title}} 的反馈报告',
  '分析文档: {{title}} (P{{page}})'
];

function setChars(val: number) {
  store.settings.charsPerPage = val;
  reloadCurrentNovel();
}

async function reloadCurrentNovel() {
  if (store.activeNovelIndex !== null) {
    await store.openNovel(store.activeNovelIndex);
  }
}

function shuffleFakeSidebar() {
  store.fakeSidebarRefreshSeed++;
  store.showToast('随机库内容已刷新');
}

function toggleFakeSidebarType(type: string) {
  const types = [...(store.settings.fakeSidebarShowForTypes || ['novel', 'dummy'])];
  const idx = types.indexOf(type);
  if (idx === -1) {
    types.push(type);
  } else {
    types.splice(idx, 1);
  }
  store.settings.fakeSidebarShowForTypes = types;
}

function setReadingMode(mode: 'page' | 'scroll') {
  store.settings.readingMode = mode;
  if (mode === 'scroll') {
    setChars(10000);
  } else {
    setChars(2000);
  }
}

</script>

<style scoped lang="less">
.bubble-settings-item {
  padding-bottom: 4px;
}

.bubble-mode-control {
  flex: 0 0 auto;
}

.segmented-control {
  display: flex;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 2px;
  gap: 2px;

  &.mini {
     .segment-btn {
        padding: 4px 8px;
        font-size: 11px;
        min-width: 50px;
     }
  }

  .segment-btn {
    padding: 6px 12px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 60px;

    &:hover {
      color: var(--text-primary);
      background: var(--bg-surface-hover);
    }

    &.active {
      background: var(--accent);
      color: white;
    }
  }
}

.sub-group-box {
  flex-direction: column !important;
  align-items: stretch !important;
  background: var(--bg-primary);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-lg);
  padding: 16px !important;
  margin: 4px 16px 16px !important;

  .sub-group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .sub-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-primary);
      opacity: 0.8;
    }

    .var-list {
      display: flex;
      gap: 6px;
      code {
        font-family: monospace;
        background: var(--bg-surface);
        padding: 1px 4px;
        border-radius: 4px;
        font-size: 10px;
        color: var(--accent);
        border: 1px solid rgba(138, 180, 248, 0.2);
      }
    }
  }
}

.template-edit-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.custom-text-input {
  width: 100%;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: 13px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: var(--text-muted);
    background-color: var(--bg-input);
  }

  &:focus {
    outline: none;
    border-color: var(--accent);
    background: var(--bg-primary);
    box-shadow: 0 0 0 2px rgba(var(--accent-rgb, 100,181,246), 0.15);
  }

  &.mini {
    padding: 4px 6px;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 500;
    
    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    appearance: textfield;
  }
}

.custom-select-alt {
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
    background-color: var(--bg-input);
  }

  &:focus {
    border-color: var(--accent);
    background: var(--bg-primary);
    box-shadow: 0 0 0 2px rgba(var(--accent-rgb, 100,181,246), 0.15);
  }

  option {
    background: var(--bg-surface);
    color: var(--text-primary);
  }
}

.template-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-tag {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    color: var(--text-primary);
    border-color: var(--accent);
    background: rgba(138, 180, 248, 0.05);
  }
}

.color-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-badge {
  font-size: 11px;
  background: var(--bg-surface-hover);
  color: var(--text-muted);
  padding: 2px 8px;
  border-radius: 4px;
}

.color-picker-input {
  -webkit-appearance: none;
  appearance: none;
  width: 40px;
  height: 24px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  padding: 0;

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  &::-webkit-color-swatch {
    border: none;
    border-radius: 3px;
  }
}

.reset-link {
  background: transparent;
  border: none;
  font-size: 11px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  
  &:hover {
    color: var(--text-primary);
  }
}

.visibility-settings {
  display: flex;
  align-items: center;
}

.check-opt {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  opacity: 0.8;
  transition: opacity 0.2s ease;

  input[type="checkbox"] {
    accent-color: var(--accent);
    cursor: pointer;
  }

  &.mini-check {
    font-size: 11px;
    gap: 4px;
    opacity: 0.7;
    margin-right: 2px;
  }

  &:hover {
    opacity: 1;
  }
}
.fake-sidebar-config-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.random-pool-info {
  font-size: 11px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-link-btn {
  background: transparent;
  border: none;
  color: var(--accent);
  text-decoration: underline;
  cursor: pointer;
  font-size: 11px;
  padding: 0;
  &:hover { opacity: 0.8; }
}

.custom-textarea {
  width: 100%;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 10px 12px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: var(--text-muted);
    background-color: var(--bg-input);
  }

  &:focus {
    outline: none;
    border-color: var(--accent);
    background: var(--bg-primary);
    box-shadow: 0 0 0 2px rgba(var(--accent-rgb, 100,181,246), 0.15);
  }
}

.info-tip-trigger {
  position: relative;
  display: flex;
  align-items: center;
  cursor: help;

  &:hover .info-tip-content {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
}

.info-tip-content {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translate(-50%, 5px);
  background: var(--bg-modal);
  border: 1px solid var(--border-color);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 11px;
  color: var(--text-secondary);
  width: 180px;
  box-shadow: var(--shadow-lg);
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  pointer-events: none;
  line-height: 1.5;
  text-align: center;
  margin-bottom: 8px;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: var(--border-color) transparent transparent transparent;
  }
}

.toggle-switch.mini {
  width: 32px;
  height: 18px;
  .toggle-slider::before {
    height: 14px;
    width: 14px;
    left: 2px;
    bottom: 2px;
  }
  input:checked + .toggle-slider::before {
    transform: translateX(14px);
  }
}
</style>
