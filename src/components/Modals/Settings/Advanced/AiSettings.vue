<template>
  <div class="advanced-sub-group">
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
    
    <div class="setting-item no-border ai-setting-row">
      <div class="setting-label label-with-desc">
        <span>API Key</span>
        <span class="desc-text">你的模型提供商密钥（仅存储在本地）</span>
      </div>
      <div class="setting-control">
        <input type="password" v-model="store.aiSettings.apiKey" placeholder="sk-..." class="ai-input" />
      </div>
    </div>
    
    <div class="setting-item no-border ai-setting-row">
      <div class="setting-label label-with-desc">
        <span>Base URL</span>
        <span class="desc-text">兼容 OpenAI 格式的接口地址</span>
      </div>
      <div class="setting-control">
        <input type="text" v-model="store.aiSettings.baseUrl" placeholder="https://api.openai.com/v1" class="ai-input" />
      </div>
    </div>
    
    <div class="setting-item no-border ai-setting-row" style="border-bottom: none;">
      <div class="setting-label label-with-desc">
        <span>模型名称 (Model)</span>
        <span class="desc-text">如 gpt-4, deepseek-chat 等</span>
      </div>
      <div class="setting-control">
        <input type="text" v-model="store.aiSettings.model" placeholder="gpt-3.5-turbo" class="ai-input" />
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAppStore } from '@/store/appStore';

const store = useAppStore();
const isDev = (import.meta as any).env.DEV;
const isTesting = ref(false);

const isImageModel = (model: string) => {
  const m = model.toLowerCase();
  return m.includes('image') || m.includes('diffusion') || m.includes('flux') || m.includes('sd-') || m.includes('stable-diffusion') || m.includes('dall-e') || m.includes('kolors') || m.includes('cogview') || m.includes('playground');
};

async function testConnection() {
  if (!store.aiSettings.apiKey) {
    store.showToast('请先填写 API Key');
    return;
  }
  
  if (!store.aiSettings.baseUrl) {
    store.showToast('请填写 Base URL');
    return;
  }

  isTesting.value = true;
  try {
    const baseUrl = store.aiSettings.baseUrl.replace(/\/$/, '');
    const actualModel = store.aiSettings.model || 'gpt-3.5-turbo';
    
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

    // Send a minimal ping request to test URL, API Key, and Model all at once
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${store.aiSettings.apiKey}`
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
  store.aiSettings.apiKey = 'sk-cgmrwmhcqoupskgbksktadlzlhxrtgixcmlthqgsgfyiddkx';
  store.aiSettings.baseUrl = 'https://api.siliconflow.cn/v1';
  store.aiSettings.model = 'deepseek-ai/DeepSeek-V3';
  store.showToast('SiliconFlow 数据已预填 🎉');
}

function prefillDev2() {
  store.aiSettings.apiKey = 'sk-cgmrwmhcqoupskgbksktadlzlhxrtgixcmlthqgsgfyiddkx';
  store.aiSettings.baseUrl = 'https://api.siliconflow.cn/v1';
  store.aiSettings.model = 'Qwen/Qwen3-VL-32B-Thinking';
  store.showToast('SiliconFlow 数据已预填 🎉');
}

function prefillDev3() {
  store.aiSettings.apiKey = 'sk-cgmrwmhcqoupskgbksktadlzlhxrtgixcmlthqgsgfyiddkx';
  store.aiSettings.baseUrl = 'https://api.siliconflow.cn/v1';
  store.aiSettings.model = 'zai-org/GLM-4.6V';
  store.showToast('SiliconFlow 数据已预填 🎉');
}

function prefillDev4() {
  store.aiSettings.apiKey = 'sk-cgmrwmhcqoupskgbksktadlzlhxrtgixcmlthqgsgfyiddkx';
  store.aiSettings.baseUrl = 'https://api.siliconflow.cn/v1';
  store.aiSettings.model = 'Kwai-Kolors/Kolors';
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
