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
      <!-- Invite section -->
      <div class="setting-item pro-banner" style="display:flex;flex-direction:column;align-items:flex-start;background:var(--bg-input);padding:16px;border-radius:12px;border:1px solid var(--border-color);gap:12px;margin-top:12px" v-if="inviteInfo">
        <div style="display:flex;align-items:center;gap:8px">
          <icon-material-symbols-group-add style="color:var(--text-link)" />
          <span style="font-weight:500">邀请升级并解锁 Pro</span>
        </div>
        <p style="font-size:13px;color:var(--text-secondary);margin:0;line-height:1.5">
          每邀请 1 名新用户即可累计，邀请 <strong style="color:var(--text-primary)">3</strong> 个有效用户免费解锁 Pro。当前进度: <strong style="color:var(--text-primary)">{{ inviteInfo.count }} / 3</strong>
        </p>
        
        <!-- Action area -->
        <div style="display:flex; gap: 8px; width: 100%; flex-wrap: wrap;">
          <button class="setting-btn" @click="copyInviteCode" style="background:var(--bg-hover);color:var(--text-primary);border:1px solid var(--border-color); flex: 1; min-width: 120px;">
            复制邀请码：{{ inviteInfo.inviteCode }}
          </button>
          
          <button class="setting-btn" @click="inputInviteCode" style="background:transparent;color:var(--text-regular);border:1px solid var(--border-color); flex: 1; min-width: 120px;">
            输入好友邀请码
          </button>
        </div>
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
      if (data.rewardToken) {
        localStorage.setItem('deep_reader_token', data.rewardToken);
        store.isPro = true;
        store.showToast('🎉 恭喜！您已成功邀请3位用户并解锁 Pro 体验！', 'info');
      }
    }
  } catch (err) {}
}

async function copyInviteCode() {
  if (!inviteInfo.value) return;
  try {
    await navigator.clipboard.writeText(inviteInfo.value.inviteCode);
    store.showToast('已复制邀请码！发送给好友体验吧', 'info');
  } catch (err) {
    store.showToast('复制失败，请手动选择复制', 'info');
  }
}

async function inputInviteCode() {
  const code = await store.promptDialog('请输入好友的邀请码（6位大写字母/数字）', '', '例如: A1B2C3', '输入邀请码');
  if (!code) return;
  
  if (code.trim().toUpperCase() === inviteInfo.value?.inviteCode) {
    return store.showToast('不能输入自己的邀请码哦', 'info');
  }

  try {
    const deviceId = await store.ensureDeviceId();
    const res = await fetch('/api/invite/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: code, deviceId })
    });
    const data = await res.json();
    if (data.success) {
      await store.saveInvitedBy(code);
      store.showToast('成功接受邀请！', 'info');
      fetchInviteInfo(); // refresh status
    } else {
      store.showToast(data.error || '无效的邀请码', 'info');
    }
  } catch (err) {
    store.showToast('网络错误，请稍后重试', 'info');
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
