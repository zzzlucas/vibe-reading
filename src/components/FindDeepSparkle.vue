<template>
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="finddeep-sparkle-svg" :style="{ width: size, height: size, pointerEvents: 'none' }">
    <defs>
      <radialGradient id="fd-sparkle-grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(2.77 11.38) rotate(18.68) scale(29.8 238.7)">
        <stop offset="0.06" stop-color="#9168C0" />
        <stop offset="0.34" stop-color="#5684D1" />
        <stop offset="0.67" stop-color="#1BA1E3" />
      </radialGradient>
    </defs>
    <path d="M16 1 C 16 9 23.5 16 31 16 C 23.5 16 16 23 16 31 C 16 23 8.5 16 1 16 C 8.5 16 16 9 16 1 Z" fill="url(#fd-sparkle-grad)" />
    <!-- 星芒内部纹理：中心微缺口的十字切割，暗含心思且低调防审查 -->
    <path d="M16 11 C 16 14 18 16 21 16 C 18 16 16 18 16 21 C 16 18 14 16 11 16 C 14 16 16 14 16 11 Z" fill="var(--bg-primary)" opacity="0.4" />
  </svg>
</template>

<script setup lang="ts">
defineProps({
  size: {
    type: String,
    default: '32px'
  }
});
</script>

<style scoped>
.finddeep-sparkle-svg {
  animation: sparkle-breath 8s ease-in-out infinite;
}

@keyframes sparkle-breath {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.02); opacity: 0.85; }
}
</style>
