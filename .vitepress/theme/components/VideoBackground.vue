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
        webkit-playsinline
        x5-playsinline
        x5-video-player-type="h5"
        x5-video-player-fullscreen="false"
        class="video-bg"
        @loadeddata="onVideoLoaded"
        @click="handleVideoClick"
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
        webkit-playsinline
        x5-playsinline
        x5-video-player-type="h5"
        x5-video-player-fullscreen="false"
        class="video-bg dark-video"
        @loadeddata="onVideoLoaded"
        @click="handleVideoClick"
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
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
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

// 监听主题变化并同步视频背景
const syncVideoWithTheme = () => {
  const html = document.documentElement
  const isDarkMode = html.classList.contains('dark')

  // 确保视频背景与当前主题同步
  if (route.path === '/') {
    // console.log('Syncing video with theme:', isDarkMode ? 'dark' : 'light')

    // 强制触发Vue响应式更新
    void showLightVideo.value
    void showDarkVideo.value

    // 确保视频播放状态正确
    setTimeout(() => {
      if (isDarkMode && darkVideoRef.value) {
        darkVideoRef.value.play().catch(e => {
          // console.log('Dark video play failed:', e)
        })
      } else if (!isDarkMode && lightVideoRef.value) {
        lightVideoRef.value.play().catch(e => {
          // console.log('Light video play failed:', e)
        })
      }
    }, 50)
  }
}

// 监听isDark变化
watch(() => isDark.value, (newVal) => {
  // console.log('isDark changed:', newVal)
  setTimeout(syncVideoWithTheme, 50)
})

// 监听路由变化
watch(() => route.path, () => {
  setTimeout(syncVideoWithTheme, 50)
})

const onVideoLoaded = () => {
  isLoaded.value = true
}

const handleVideoClick = () => {
  // 移动端点击视频时尝试播放
  if (lightVideoRef.value && showLightVideo.value) {
    lightVideoRef.value.play().catch(e => {
      console.log('Light video play on click failed:', e)
    })
  }
  if (darkVideoRef.value && showDarkVideo.value) {
    darkVideoRef.value.play().catch(e => {
      console.log('Dark video play on click failed:', e)
    })
  }
}

onMounted(() => {
  // 确保视频自动播放
  const attemptVideoPlay = (videoRef: HTMLVideoElement | undefined, videoName: string) => {
    if (!videoRef) return

    videoRef.play().catch(e => {
      // console.log(`${videoName} video autoplay failed:`, e)

      // 移动端策略：确保静音并重试播放
      videoRef.muted = true
      videoRef.play().then(() => {
        // console.log(`${videoName} video autoplay succeeded with mute`)
      }).catch(() => {
        // console.log(`${videoName} video muted autoplay also failed`)
      })
    })
  }

  // 初始播放视频
  attemptVideoPlay(lightVideoRef.value, 'Light')
  attemptVideoPlay(darkVideoRef.value, 'Dark')

  // 初始同步主题
  syncVideoWithTheme()

  // 监听主题变化
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        syncVideoWithTheme()
      }
    })
  })

  // 监听HTML元素类变化
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })

  // 监听storage变化（主题偏好变化）
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'vitepress-theme-appearance') {
      setTimeout(syncVideoWithTheme, 100) // 延迟确保DOM已更新
    }
  }

  window.addEventListener('storage', handleStorageChange)

  // 清理函数
  return () => {
    observer.disconnect()
    window.removeEventListener('storage', handleStorageChange)
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