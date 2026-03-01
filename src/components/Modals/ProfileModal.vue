<template>
  <div class="modal-overlay" v-if="store.showProfileModal" @click.self="closeModal">
    <div class="modal-container profile-modal">
      <div class="modal-header">
        <h2>更换个人资料</h2>
        <button class="icon-btn" @click="closeModal">
          <icon-material-symbols-close />
        </button>
      </div>

      <div class="modal-body">
        <div class="profile-edit-form">
          <div class="avatar-upload-section">
            <div class="avatar-preview" @click="triggerUpload">
              <img v-if="previewAvatar" :src="previewAvatar" />
              <div class="avatar-placeholder" v-else :style="previewAvatarColor ? { background: previewAvatarColor } : {}">
                <span>{{ previewName ? previewName.charAt(0).toUpperCase() : 'Z' }}</span>
              </div>
              <div class="upload-overlay">
                <icon-material-symbols-photo-camera />
              </div>
            </div>
            <div class="upload-hint">点击更换头像 (上限 2MB)</div>
            <button v-if="previewAvatar" class="remove-avatar-btn" @click="previewAvatar = null">移除头像</button>
            <input type="file" ref="fileInput" accept="image/*" style="display:none" @change="handleFileChange" />
          </div>

          <div class="form-group">
            <label>用户名</label>
            <input type="text" class="profile-input" v-model="previewName" placeholder="请输入您的昵称" maxlength="20" />
            <div class="input-hint">用于在界面中展示您的名称。</div>
          </div>

          <div class="form-group">
            <label>头像背景色 (无头像时生效)</label>
            <div class="color-palette">
              <div 
                class="color-option default-color" 
                :class="{ active: previewAvatarColor === null }"
                @click="previewAvatarColor = null"
                title="默认渐变"
              >
                <div class="color-swatch-gradient"></div>
              </div>
              <div 
                v-for="color in presetColors" 
                :key="color"
                class="color-option"
                :class="{ active: previewAvatarColor === color }"
                @click="previewAvatarColor = color"
              >
                <div class="color-swatch" :style="{ backgroundColor: color }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeModal">取消</button>
        <button class="btn btn-primary" @click="saveProfile">保存和应用</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAppStore } from '@/store/appStore';

const store = useAppStore();

const previewName = ref('');
const previewAvatar = ref<string | null>(null);
const previewAvatarColor = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const presetColors = [
  '#4285f4', '#34a853', '#fbbc05', '#ea4335', // Google Colors
  '#1a73e8', '#9334e6', '#ff6d00', '#00acc1', 
  '#673ab7', '#e91e63', '#607d8b', '#795548',
  '#212121', '#171717', '#4a4a4f'
];

watch(() => store.showProfileModal, (newVal) => {
  if (newVal) {
    previewName.value = store.userName;
    previewAvatar.value = store.userAvatar;
    previewAvatarColor.value = store.userAvatarColor;
  }
});

function closeModal() {
  store.showProfileModal = false;
}

function triggerUpload() {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  // Max 2MB checking
  if (file.size > 2 * 1024 * 1024) {
    store.showToast('头像文件过大，请选择 2MB 以下的图片。');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    previewAvatar.value = event.target?.result as string;
  };
  reader.readAsDataURL(file);
  target.value = ''; // Reset
}

function saveProfile() {
  const nameToSave = previewName.value.trim();
  if (!nameToSave) {
    store.showToast('用户名不能为空。');
    return;
  }
  
  store.userName = nameToSave;
  store.userAvatar = previewAvatar.value;
  store.userAvatarColor = previewAvatarColor.value;
  store.showProfileModal = false;
  store.showToast('个人资料已保存。');
}
</script>

<style scoped lang="less">
.profile-modal {
  width: 440px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.profile-edit-form {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.avatar-upload-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.avatar-preview {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  background: var(--bg-surface);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .avatar-placeholder {
    width: 100%;
    height: 100%;
    background: var(--sparkle-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    font-weight: 500;
    color: white;
  }
  
  .upload-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transition: opacity 0.2s;
    
    .material-symbols-outlined {
      font-size: 32px;
    }
  }
  
  &:hover .upload-overlay {
    opacity: 1;
  }
}

.remove-avatar-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
  padding: 4px;
  margin-top: -8px;
  
  &:hover {
    color: var(--accent-pink);
  }
}

.upload-hint {
  font-size: 13px;
  color: var(--text-muted);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
  }
}

.profile-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
  transition: border-color var(--transition-speed);
  
  &:focus {
    border-color: var(--accent);
  }
}

.input-hint {
  font-size: 12px;
  color: var(--text-muted);
}

.color-palette {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 4px;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid transparent;
  transition: all var(--transition-speed);
  
  &:hover {
    transform: scale(1.1);
  }
  
  &.active {
    border-color: var(--accent);
    transform: scale(1.1);
  }
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.color-swatch-gradient {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--sparkle-bg);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.btn {
  padding: 8px 16px;
  border-radius: var(--radius-xl);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-speed);
  border: 1px solid transparent;
}

.btn-primary {
  background-color: var(--accent);
  color: #fff;
  border-color: var(--accent);
  
  &:hover {
    filter: brightness(1.1);
  }
}

.btn-secondary {
  background-color: transparent;
  color: var(--text-primary);
  border-color: var(--border-color);
  
  &:hover {
    background-color: var(--bg-surface-hover);
  }
}
</style>
