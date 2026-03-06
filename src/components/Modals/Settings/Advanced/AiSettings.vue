<template>
  <div class="advanced-sub-group" id="ai-api-key-section">
    <div class="sub-group-title">
      <icon-material-symbols-smart-toy />
      <span>AI 接入</span>
      <div class="title-tips">
        <icon-material-symbols-help-outline />
        <div class="tips-content">
          支持 OpenAI 标准格式接口。目前已适配基础对话、深度思考 (CoT)、识图 (VLM) 及文生图。
        </div>
      </div>
    </div>
    
    <div class="config-tabs-container">
      <div class="config-tabs">
        <div v-for="(cf, index) in store.aiSettings.configs" :key="cf.id" 
             class="config-tab" :class="{ 'active': currentConfigId === cf.id }"
             @click="currentConfigId = cf.id">
          <span class="tab-name">{{ cf.name || `配置 ${index + 1}` }}</span>
          <div v-if="store.aiSettings.configs.length > 1" @click.stop="removeConfig(cf.id)" class="remove-btn" title="删除当前配置">
            <svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
          </div>
        </div>
        <button v-if="store.aiSettings.configs.length < 5" @click="addConfig" class="config-tab add-btn" title="新增配置（最多5条）">
          <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </button>
      </div>
    </div>

    <template v-if="currentConfig">
      <div class="setting-item no-border ai-setting-row" style="padding-top: 4px;">
        <div class="setting-label label-with-desc">
          <span>配置名称</span>
          <span class="desc-text">在对话界面下拉菜单中显示的标识</span>
        </div>
        <div class="setting-control">
          <input type="text" v-model="currentConfig.name" placeholder="例如: Gemini Advanced, DeepSeek" class="ai-input" />
        </div>
      </div>
      
      <div class="setting-item no-border ai-setting-row">
        <div class="setting-label label-with-desc">
          <span>API Key</span>
          <span class="desc-text">你的模型提供商密钥（仅存储在本地）</span>
        </div>
        <div class="setting-control">
          <input type="password" v-model="currentConfig.apiKey" placeholder="sk-..." class="ai-input" />
        </div>
      </div>
      
      <div class="setting-item no-border ai-setting-row">
        <div class="setting-label label-with-desc">
          <span>Base URL</span>
          <span class="desc-text">兼容 OpenAI 格式的接口地址</span>
        </div>
        <div class="setting-control">
          <input type="text" v-model="currentConfig.baseUrl" placeholder="https://api.openai.com/v1" class="ai-input" />
        </div>
      </div>
      
      <div class="setting-item no-border ai-setting-row" style="border-bottom: none;">
        <div class="setting-label label-with-desc">
          <span>模型名称 (Model)</span>
          <span class="desc-text">如 gpt-4, deepseek-chat 等</span>
        </div>
        <div class="setting-control">
          <input type="text" v-model="currentConfig.model" placeholder="gpt-3.5-turbo" class="ai-input" />
        </div>
      </div>
      
      <div class="ai-actions">
        <button class="setting-btn" @click="testConnection" :disabled="isTesting">
          <icon-material-symbols-wifi v-if="!isTesting" />
          <icon-material-symbols-pending v-else />
          {{ isTesting ? '测试中...' : '连通性测试' }}
        </button>
        <button class="setting-btn" v-if="isDev" @click="prefillDev">
          基础
        </button>
        <button class="setting-btn" v-if="isDev" @click="prefillDev2">
          思考
        </button>
        <button class="setting-btn" v-if="isDev" @click="prefillDev3">
          多模态
        </button>
        <button class="setting-btn" v-if="isDev" @click="prefillDev4">
          文生图
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '@/store/appStore';

const store = useAppStore();
const isDev = (import.meta as any).env.DEV;
const isTesting = ref(false);

const currentConfigId = ref(store.aiSettings.activeConfigId || (store.aiSettings.configs[0]?.id));
const currentConfig = computed(() => {
  return store.aiSettings.configs.find(c => c.id === currentConfigId.value) || store.aiSettings.configs[0];
});

function addConfig() {
  if (store.aiSettings.configs.length >= 5) {
    store.showToast('最多仅支持配置 5 条 AI 接入记录');
    return;
  }
  const newId = store.generateUid();
  store.aiSettings.configs.push({
    id: newId,
    name: '新配置',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo'
  });
  currentConfigId.value = newId;
}

function removeConfig(id: string) {
  if (store.aiSettings.configs.length <= 1) return;
  const idx = store.aiSettings.configs.findIndex(c => c.id === id);
  if (idx !== -1) {
    store.aiSettings.configs.splice(idx, 1);
    if (currentConfigId.value === id) {
      // 切换到相邻配置，优先后一个
      const nextConfig = store.aiSettings.configs[idx] || store.aiSettings.configs[idx - 1];
      if (nextConfig) {
        currentConfigId.value = nextConfig.id;
      }
      
    }
  }
  // 如果删掉的是当前激活（使用中）的，顺便切走使用中的
  if (store.aiSettings.activeConfigId === id) {
     store.aiSettings.activeConfigId = store.aiSettings.configs[0].id;
  }
}

const isImageModel = (model: string) => {
  const m = model.toLowerCase();
  return m.includes('image') || m.includes('diffusion') || m.includes('flux') || m.includes('sd-') || m.includes('stable-diffusion') || m.includes('dall-e') || m.includes('kolors') || m.includes('cogview') || m.includes('playground');
};

async function testConnection() {
  const config = currentConfig.value;
  if (!config) return;

  if (!config.apiKey) {
    store.showToast('请先填写 API Key');
    return;
  }
  
  if (!config.baseUrl) {
    store.showToast('请填写 Base URL');
    return;
  }

  isTesting.value = true;
  try {
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    const actualModel = config.model || 'gpt-3.5-turbo';
    
    let path = '/chat/completions';
    let body: any = {
      model: actualModel,
      messages: [{ role: 'user', content: 'Ping' }],
      max_tokens: 1
    };

    if (isImageModel(actualModel)) {
      path = '/images/generations';
      body = {
        model: actualModel,
        prompt: 'a small cute robot'
      };
    }

    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      store.showToast('🥳 连通性测试成功！参数配置无误');
    } else {
      const errText = await res.text();
      store.showActionToast(`连通性测试失败: 错误码 ${res.status}`, '报错详情', () => {
        store.confirmDialog(errText, '报错详情');
      });
    }
  } catch (err: any) {
    store.showActionToast(`连通性测试异常`, '报错详情', () => {
      store.confirmDialog(err.message || String(err), '报错详情');
    });
  } finally {
    isTesting.value = false;
  }
}

function prefillDev() {
  if (!currentConfig.value) return;
  currentConfig.value.name = 'DeepSeek V3';
  currentConfig.value.apiKey = 'sk-cgmrwmhcqoupskgbksktadlzlhxrtgixcmlthqgsgfyiddkx';
  currentConfig.value.baseUrl = 'https://api.siliconflow.cn/v1';
  currentConfig.value.model = 'deepseek-ai/DeepSeek-V3';
  store.showToast('SiliconFlow 数据已预填 🎉');
}

function prefillDev2() {
  if (!currentConfig.value) return;
  currentConfig.value.name = 'Qwen 3 VL';
  currentConfig.value.apiKey = 'sk-cgmrwmhcqoupskgbksktadlzlhxrtgixcmlthqgsgfyiddkx';
  currentConfig.value.baseUrl = 'https://api.siliconflow.cn/v1';
  currentConfig.value.model = 'Qwen/Qwen3-VL-32B-Thinking';
  store.showToast('SiliconFlow 数据已预填 🎉');
}

function prefillDev3() {
  if (!currentConfig.value) return;
  currentConfig.value.name = 'GLM 4.6V';
  currentConfig.value.apiKey = 'sk-cgmrwmhcqoupskgbksktadlzlhxrtgixcmlthqgsgfyiddkx';
  currentConfig.value.baseUrl = 'https://api.siliconflow.cn/v1';
  currentConfig.value.model = 'zai-org/GLM-4.6V';
  store.showToast('SiliconFlow 数据已预填 🎉');
}

function prefillDev4() {
  if (!currentConfig.value) return;
  currentConfig.value.name = 'Kolors 文生图';
  currentConfig.value.apiKey = 'sk-cgmrwmhcqoupskgbksktadlzlhxrtgixcmlthqgsgfyiddkx';
  currentConfig.value.baseUrl = 'https://api.siliconflow.cn/v1';
  currentConfig.value.model = 'Kwai-Kolors/Kolors';
  store.showToast('SiliconFlow 数据已预填 🎉');
}
</script>

<style scoped lang="less">
.ai-setting-row {
  flex-direction: column;
  align-items: stretch !important;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px dashed rgba(128, 128, 128, 0.1) !important;
  
  .setting-label {
    align-items: flex-start;
  }
}

.config-tabs-container {
  margin-top: 12px;
  margin-bottom: 8px;
  overflow-x: auto;
  
  /* hide scrollbar */
  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
}

.config-tabs {
  display: flex;
  gap: 8px;
  align-items: center;
}

.config-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;

  .tab-name {
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &:hover {
    background: var(--bg-surface-hover);
    color: var(--text-primary);
  }

  &.active {
    background: var(--bg-primary);
    border-color: var(--accent);
    color: var(--accent);
    box-shadow: 0 0 0 1px rgba(var(--accent-rgb, 100,181,246), 0.2);
  }

  .remove-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: -4px;
    opacity: 0.5;
    transition: all 0.2s;
    
    &:hover {
      opacity: 1;
      background: rgba(255, 0, 0, 0.1);
      color: #ff4444;
    }
  }

  &.add-btn {
    padding: 6px 12px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.sub-group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  
  .title-tips {
    position: relative;
    display: flex;
    align-items: center;
    color: var(--text-muted);
    cursor: help;
    font-size: 16px;
    margin-left: 2px;
    opacity: 0.6;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
      .tips-content {
        visibility: visible;
        opacity: 1;
        transform: translateY(0);
      }
    }

    .tips-content {
      position: absolute;
      bottom: calc(100% + 10px);
      left: 50%;
      transform: translateX(-50%) translateY(5px);
      width: 200px;
      padding: 10px 14px;
      background: var(--bg-modal);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      font-size: 12px;
      line-height: 1.6;
      color: var(--text-secondary);
      pointer-events: none;
      visibility: hidden;
      opacity: 0;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 100;
      font-weight: normal;

      &::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 6px solid transparent;
        border-top-color: var(--bg-modal);
      }
    }
  }
}

.ai-input {
  width: 100%;
  padding: 8px 14px;
  border-radius: var(--radius-md, 12px);
  border: 1px solid var(--border-color);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 13px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  outline: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  &::placeholder {
    color: var(--text-muted);
    opacity: 0.6;
  }
  
  &:hover {
    border-color: var(--text-muted);
    background-color: var(--bg-input);
  }

  &:focus {
    border-color: var(--accent);
    background-color: var(--bg-primary);
    box-shadow: 0 0 0 2px rgba(var(--accent-rgb, 100,181,246), 0.15);
  }
}

.ai-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
  padding-top: 16px;
  border-top: 1px dashed rgba(128, 128, 128, 0.1);
}
</style>
