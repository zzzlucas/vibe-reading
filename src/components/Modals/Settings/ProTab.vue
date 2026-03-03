<template>
  <div class="settings-section" v-if="!store.isPro" :class="{ 'is-collapsed': isCollapsed }">
    <div class="section-header" @click="isCollapsed = !isCollapsed">
      <h3>升级 Pro</h3>
      <icon-material-symbols-expand-more class="collapse-icon" />
    </div>
    <div class="section-body">
      <!-- Invite section -->
      <div class="setting-item pro-banner" style="display:flex;flex-direction:column;align-items:flex-start;background:var(--bg-input);padding:16px;border-radius:12px;border:1px solid var(--border-color);gap:12px" v-if="inviteInfo">
        <div style="display:flex;align-items:center;gap:8px">
          <icon-material-symbols-group-add style="color:var(--text-link)" />
          <span style="font-weight:500">邀请升级并解锁 Pro</span>
        </div>
        <p style="font-size:13px;color:var(--text-secondary);margin:0;line-height:1.5">
          每邀请 1 名新用户即可累计，邀请 <strong style="color:var(--text-primary)">3</strong> 个有效用户免费解锁 Pro。当前进度: <strong style="color:var(--text-primary)">{{ inviteInfo.count }} / 3</strong>
        </p>
        
        <!-- Action area -->
        <div style="display: flex; align-items: center; gap: 12px; margin-top: 4px; width: 100%;">
          <button class="setting-btn" @click="generateInviteLink" style="background:var(--text-primary);color:var(--bg-primary);border:none; white-space: nowrap; flex-shrink: 0;">
            生成邀请链接
          </button>
          <div v-if="generatedLink" style="font-size: 13px; color: var(--text-primary); background: var(--bg-surface); padding: 8px 12px; border-radius: 8px; border: 1px dashed var(--border-color); flex: 1; user-select: all; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="generatedLink">
            {{ generatedLink }}
          </div>
        </div>
      </div>

      <div class="setting-item pro-banner" style="display:flex;flex-direction:column;align-items:flex-start;background:var(--bg-input);padding:16px;border-radius:12px;border:1px solid var(--border-color);gap:12px;margin-top:12px">
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
const inviteInfo = ref<{ inviteCode: string, count: number } | null>(null);
const generatedLink = ref('');

function openPro() {
  store.showSettings = false;
  store.showActivateModal = true;
}

async function fetchInviteInfo() {
  try {
    const deviceId = await store.ensureDeviceId();
    const res = await fetch(`/api/invite/info?deviceId=${deviceId}`);
    const data = await res.json();
    if (data.inviteCode) {
      inviteInfo.value = { inviteCode: data.inviteCode, count: data.count };
      
      // Auto-generate display link so it shows up persistently
      const url = new URL(window.location.href);
      url.search = ''; 
      url.searchParams.set('invite', data.inviteCode);
      generatedLink.value = url.toString();

      if (data.rewardToken) {
        localStorage.setItem('deep_reader_token', data.rewardToken);
        store.isPro = true;
        store.showToast('🎉 恭喜！您已成功邀请3位用户并解锁 Pro 体验！', 'info');
      }
    }
  } catch (err) {}
}

async function generateInviteLink() {
  if (!inviteInfo.value) return;
  store.trackEvent('click_invite_link');
  try {
    const url = new URL(window.location.href);
    url.search = ''; // break out any old query
    url.searchParams.set('invite', inviteInfo.value.inviteCode);
    const finalUrl = url.toString();
    
    generatedLink.value = finalUrl;
    await navigator.clipboard.writeText(finalUrl);
    store.showToast('生成成功！已将您的专属链接复制到剪贴板，快去发送给好友体验吧！', 'info');
  } catch (err) {
    store.showToast('复制失败，请重试', 'info');
  }
}

onMounted(() => {
  const saved = localStorage.getItem('deep_reader_collapsed_sections');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.pro !== undefined) isCollapsed.value = parsed.pro;
    } catch (e) {}
  }
  fetchInviteInfo();
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
