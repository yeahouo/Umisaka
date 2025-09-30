<template>
  <div class="background-container">
    <!-- 日间模式视频背景 -->
    <div class="video-background" :class="{ 'hidden': !showLightVideo }">
      <video
        ref="lightVideoRef"
        autoplay
        muted
        loop
        playsinline
        class="video-bg"
        @loadeddata="onVideoLoaded"
      >
        <source src="/background.mp4" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      <div class="overlay"></div>
    </div>

    <!-- 暗色模式视频背景 -->
    <div class="video-background" :class="{ 'hidden': !showDarkVideo }">
      <video
        ref="darkVideoRef"
        autoplay
        muted
        loop
        playsinline
        class="video-bg dark-video"
        @loadeddata="onVideoLoaded"
      >
        <source src="/wallpaper.mp4" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      <div class="overlay"></div>
    </div>

    <!-- 纯色背景 -->
    <div class="solid-background" :class="{ 'hidden': showVideo }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useData, useRoute } from 'vitepress'

const lightVideoRef = ref<HTMLVideoElement>()
const darkVideoRef = ref<HTMLVideoElement>()
const isLoaded = ref(false)
const { isDark } = useData()
const route = useRoute()

// 判断是否显示视频背景
const showVideo = computed(() => {
  // 在首页（无论是日间模式还是暗色模式）显示视频背景
  if (route.path === '/') {
    return true
  }
  // 其他页面都显示纯色背景
  return false
})

// 判断是否显示日间模式视频背景
const showLightVideo = computed(() => {
  return route.path === '/' && !isDark.value
})

// 判断是否显示暗色模式视频背景
const showDarkVideo = computed(() => {
  return route.path === '/' && isDark.value
})

const onVideoLoaded = () => {
  isLoaded.value = true
}

onMounted(() => {
  // 确保视频自动播放
  if (lightVideoRef.value) {
    lightVideoRef.value.play().catch(e => {
      console.log('Light video autoplay failed:', e)
    })
  }
  if (darkVideoRef.value) {
    darkVideoRef.value.play().catch(e => {
      console.log('Dark video autoplay failed:', e)
    })
  }
})
</script>

<style scoped>
.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.video-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.video-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  min-width: 100%;
  min-height: 100%;
}

/* 暗色模式视频位置调整 */
.dark-video {
  object-position: 50% center;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0); /* 移除遮罩，保持视频原亮度 */
  pointer-events: none;
}

.solid-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--vp-c-bg);
}

/* 暗色模式下的纯色背景 */
.dark .solid-background {
  background: var(--vp-c-bg);
}

.hidden {
  display: none;
}
</style>