<script setup lang="ts">
import { VPTeamMembers } from 'vitepress/theme'
import { creators } from '../../creators'
import { siteName } from '../../../metadata'
import { ref, onMounted, onUnmounted } from 'vue'

// 响应式状态
const isMobile = ref(false)

// 检测是否为移动设备
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// 监听窗口大小变化
const handleResize = () => {
  checkMobile()
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="content">
    <div class="content-container">
      <main class="main">
        <div class="vp-doc" mt-10 flex flex-col items-center>
          <h2 id="meet-the-team" font-normal op50 p="t-10 b-2">
            {{ siteName }} Creators
          </h2>

          <!-- 桌面端使用原来的small配置 -->
          <div v-if="!isMobile" w-full p-10>
            <VPTeamMembers size="small" :members="creators" flex justify-center />
          </div>

          <!-- 手机端使用medium配置实现更好的居中效果 -->
          <div v-else class="mobile-team-container">
            <VPTeamMembers size="medium" :members="creators" />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.mobile-team-container {
  width: 100%;
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 确保手机端medium尺寸的团队成员组件居中 */
@media (max-width: 768px) {
  .mobile-team-container {
    padding: 0.5rem;
    display: flex;
    justify-content: flex-end; /* 改为右对齐 */
    align-items: center;
    padding-right: 5rem; /* 增加右侧间距，让Umi卡片更靠右 */
  }
}

/* 小屏幕手机进一步调整 */
@media (max-width: 480px) {
  .mobile-team-container {
    padding-right: 2.5rem; /* 小屏幕保持适当右侧间距 */
  }
}
</style>
