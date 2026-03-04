<template>
  <div class="advanced-sub-group">
    <div class="sub-group-title">
       <icon-material-symbols-campaign />
       <span>用户反馈</span>
    </div>
    <div class="feedback-form mini-feedback">
      <div class="feedback-type-selector">
        <button class="type-tag" :class="{ active: feedbackType === 'bug' }" @click="feedbackType = 'bug'">Bug</button>
        <button class="type-tag" :class="{ active: feedbackType === 'feature' }" @click="feedbackType = 'feature'">需求</button>
      </div>
      <textarea class="feedback-textarea" v-model="feedbackText" placeholder="欢迎吐槽、建议、创意点子..." rows="2"></textarea>
      <div class="feedback-actions" style="display: flex; justify-content: space-between; align-items: center;">
        <input type="text" v-model="feedbackContact" class="name-input-small" placeholder="联系方式 (选填)" style="width: 120px;">
        <button class="setting-btn feedback-submit-btn" :disabled="sendingFeedback" @click="sendFeedback">
          {{ sendingFeedback ? '发送中' : '发送' }}
        </button>
      </div>
      <div v-if="feedbackStatusMsg" class="feedback-status" :class="feedbackStatusType">{{ feedbackStatusMsg }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAppStore } from '@/store/appStore';
import { apiFetch } from '@/utils/request';

const store = useAppStore();
const feedbackText = ref('');
const feedbackContact = ref('');
const feedbackType = ref<'bug' | 'feature' | 'payment'>('bug');
const feedbackStatusMsg = ref('');
const feedbackStatusType = ref('');
const sendingFeedback = ref(false);

async function sendFeedback() {
  if (!feedbackText.value.trim()) {
    feedbackStatusMsg.value = '请输入反馈内容';
    feedbackStatusType.value = 'error';
    return;
  }
  
  sendingFeedback.value = true;
  feedbackStatusMsg.value = '正在发送...';
  feedbackStatusType.value = '';
  
  try {
    const debugInfo = {
      skin: store.style,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent,
      isPro: store.isPro,
      timestamp: new Date().toISOString()
    };

    const res = await apiFetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: feedbackText.value, 
        contact: feedbackContact.value,
        type: feedbackType.value,
        debug: debugInfo
      })
    });
    const result = await res.json();
    if (res.ok) {
      feedbackStatusMsg.value = '✓ ' + result.message;
      feedbackStatusType.value = 'success';
      feedbackText.value = '';
      feedbackContact.value = '';
    } else {
      feedbackStatusMsg.value = '✗ ' + (result.error || '发送失败');
      feedbackStatusType.value = 'error';
    }
  } catch (e) {
    feedbackStatusMsg.value = '服务未启动，正在打开邮件客户端...';
    feedbackStatusType.value = '';
    const subject = encodeURIComponent('[Gemini Reader 反馈] ' + feedbackText.value.substring(0, 30));
    const body = encodeURIComponent(`反馈内容：\n${feedbackText.value}\n\n联系方式：${feedbackContact.value || '未填写'}`);
    window.open(`mailto:zehcoid@foxmail.com?subject=${subject}&body=${body}`, '_blank');
  }
  sendingFeedback.value = false;
}
</script>
