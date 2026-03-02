<template>
  <div v-if="modelValue" class="image-preview-overlay" @click="$emit('update:modelValue', null)">
    <div class="preview-close-btn">
      <icon-material-symbols-close />
    </div>
    <img :src="modelValue" class="preview-full-img" @click.stop />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string | null;
}>();

defineEmits(['update:modelValue']);
</script>

<style scoped lang="less">
.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 40px;
  backdrop-filter: blur(8px);
  animation: fadeIn 0.2s ease;
}

.preview-close-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  svg {
    font-size: 24px;
  }
}

.preview-full-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
