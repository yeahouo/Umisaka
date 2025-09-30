<template>
  <div
    class="music-player"
    :class="{ 'dragging': isDragging, 'mounted': isMounted, 'mobile-hidden': isMobile && isHidden }"
    :style="playerStyle"
    tabindex="0"
    @mousedown="startDrag"
    @touchstart="startDrag"
    @keydown="handleKeyDown"
  >
    <audio
      ref="audioRef"
      :src="musicSrc"
      autoplay
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
      @error="onError"
    />

    <div class="music-controls" :class="{ 'hidden': !showControls }">
      <button
        class="control-btn"
        @click="togglePlay"
        :title="isPlaying ? 'Pause' : 'Play'"
      >
        <div :class="isPlaying ? 'pause-icon' : 'play-icon'"></div>
      </button>


      <button
        class="control-btn"
        @click="toggleVolumeControl"
        :title="isMuted ? 'Unmute' : 'Volume Control'"
      >
        <img
          :src="speakerIcon"
          :alt="isMuted ? 'Muted' : 'Volume'"
          class="icon-svg"
        />
      </button>

      <!-- Previous/Next Buttons -->
      <button
        class="control-btn nav-btn"
        @click="playPrevious"
        :title="playMode === 'listOnce' && !hasPrevious() ? 'No Previous Track' : 'Previous Track'"
        :disabled="playMode === 'listOnce' && !hasPrevious()"
      >
        <img
          src="/music/icons/prev-svgrepo-com.svg"
          alt="Previous Track"
          class="icon-svg nav-icon"
          :class="{ 'disabled': playMode === 'listOnce' && !hasPrevious() }"
        />
      </button>

      <!-- Progress Bar -->
      <div class="progress-control">
        <input
          type="range"
          min="0"
          max="99"
          step="0.1"
          v-model="progress"
          @input="updateProgress"
          @click="handleProgressClick"
          class="progress-slider"
          tabindex="0"
        />
      </div>

      <button
        class="control-btn nav-btn"
        @click="playNext"
        :title="playMode === 'listOnce' && !hasNext() ? 'No Next Track' : 'Next Track'"
        :disabled="playMode === 'listOnce' && !hasNext()"
      >
        <img
          src="/music/icons/next-svgrepo-com.svg"
          alt="Next Track"
          class="icon-svg nav-icon"
          :class="{ 'disabled': playMode === 'listOnce' && !hasNext() }"
        />
      </button>

      <!-- Hint Dialog -->
      <div
        v-if="showNavHint"
        class="nav-hint"
        :class="{ show: showNavHint }"
      >
        <img
          src="/music/icons/chat-square-svgrepo-com.svg"
          alt="Hint"
          class="hint-icon"
        />
        <span class="hint-text">{{ hintText }}</span>
      </div>

      <button
        class="control-btn"
        @click="togglePlaylist"
        :title="showPlaylist ? 'Close Playlist' : 'Open Playlist'"
      >
        <img
          src="/music/icons/list-music-svgrepo-com.svg"
          alt="Playlist"
          class="icon-svg"
        />
      </button>

      <button
        class="control-btn"
        @click="togglePlayMode"
        :title="getPlayModeTitle()"
      >
        <img
          :src="playModeIcon"
          :alt="getPlayModeTitle()"
          class="icon-svg"
        />
      </button>

      </div>

    <!-- Vertical Volume Control -->
    <div
      v-if="showVolumeControl"
      ref="volumeControlRef"
      class="volume-control-vertical"
      :class="{ show: showVolumeControl }"
      @mousedown="startVolumeDrag"
      @click="handleVolumeClick"
    >
      <div class="cloud-texture"></div>
      <div class="volume-track">
        <div class="volume-fill" :style="{ height: volume * 100 + '%' }"></div>
      </div>
    </div>

    <!-- Playlist -->
    <div
      v-if="showPlaylist"
      class="music-playlist"
      :class="{ show: showPlaylist }"
    >
      <div class="cloud-texture"></div>
      <div class="playlist-header">Playlist</div>
      <div
        v-for="(music, index) in musicList"
        :key="index"
        class="playlist-item"
        :class="{ active: currentMusic === music.name, show: showPlaylist }"
        @click="playMusic(music)"
      >
        <div class="music-info">
          <div class="music-name">{{ music.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, nextTick, watch } from 'vue'
import { useData } from 'vitepress'

const audioRef = ref<HTMLAudioElement>()
const isPlaying = ref(false)
const isMuted = ref(false)
const volume = ref(0.5) // Default volume 50%
const { frontmatter } = useData()

// 动画控制状态
const isMounted = ref(false)

// Playlist related state
const showPlaylist = ref(false)
const musicList = ref<Array<{name: string, size: number}>>([])
const currentMusic = ref('')
const lastScanTime = ref(0) // 上次扫描时间
const autoRefreshInterval = ref<NodeJS.Timeout | null>(null) // 自动刷新定时器

// Volume control related state
const showVolumeControl = ref(false)
const lastClickTime = ref(0)
const progress = ref(0) // Playback progress
const isVolumeDragging = ref(false) // Whether volume is being dragged
const volumeControlRef = ref<HTMLElement>() // Volume control container reference

// 播放模式状态
type PlayMode = 'singleLoop' | 'listLoop' | 'listOnce' | 'random'
const playMode = ref<PlayMode>('listLoop') // Default list loop play mode

// Random play related state
const playedSongs = ref<string[]>([]) // Record of played songs
const remainingSongs = ref<string[]>([]) // Remaining unplayed songs

// 导航按钮相关状态
const showNavHint = ref(false)
const hintText = ref('')
let hintTimeout: NodeJS.Timeout | null = null

// 键盘进度控制相关状态
const isKeyAdjustingProgress = ref(false)
const keyAdjustmentStartTime = ref(0)
const currentDirection = ref<'left' | 'right'>('right')
const originalPlaybackRate = ref(1.0)
let keyRepeatTimer: NodeJS.Timeout | null = null

// 拖动相关状态
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const position = ref({ x: 20, y: 900 }) // 默认位置，X轴将在组件挂载后调整

// 移动端边缘隐藏相关状态
const isMobile = ref(false)
const isHidden = ref(false)
const isTouchingEdge = ref(false)
const hideTimeout = ref<NodeJS.Timeout | null>(null)


// 计算播放器样式
const playerStyle = computed(() => {
  const baseStyle = {
    top: `${position.value.y}px`,
    cursor: isDragging.value ? 'grabbing' : 'grab'
  }

  if (isMobile.value && isHidden.value) {
    // 隐藏状态：只显示边缘
    return {
      ...baseStyle,
      left: `${-380}px`, // 只显示20px的边缘
      transition: 'left 0.3s ease'
    }
  } else {
    // 正常显示状态
    return {
      ...baseStyle,
      left: `${position.value.x}px`,
      transition: isMobile.value ? 'left 0.3s ease' : 'none'
    }
  }
})

// 音乐文件路径，可以从播放列表中选择
const musicSrc = computed(() => {
  return currentMusic.value ? `/music/${currentMusic.value}` : (frontmatter.value.backgroundMusic || '/music/background.mp3')
})


// 是否显示控制按钮
const showControls = computed(() => {
  // 可以从frontmatter中控制是否显示音乐控件
  return frontmatter.value.showMusicControls !== false
})

const togglePlay = () => {
  // 检查单次播放模式是否已完成
  if (playMode.value === 'listOnce' && !isPlaying.value) {
    const currentIndex = musicList.value.findIndex(music => music.name === currentMusic.value)
    // 如果是最后一首歌且已停止播放，重新开始播放第一首
    if (currentIndex === musicList.value.length - 1) {
      if (musicList.value.length > 0) {
        playMusic(musicList.value[0])
        showHint('Restarting playlist')
      }
      return
    }
  }

  if (audioRef.value) {
    if (isPlaying.value) {
      audioRef.value.pause()
    } else {
      audioRef.value.play().catch(e => {
        console.log('Audio play failed:', e)
      })
    }
  }
}

const toggleVolumeControl = () => {
  const currentTime = Date.now()

  if (currentTime - lastClickTime.value < 300) {
    // 双击静音
    if (audioRef.value) {
      audioRef.value.muted = !isMuted.value
      isMuted.value = audioRef.value.muted
    }
    showVolumeControl.value = false
  } else {
    // 单击显示/隐藏音量条
    showVolumeControl.value = !showVolumeControl.value
  }

  lastClickTime.value = currentTime
}


const updateProgress = (e?: Event) => {
  if (e) {
    e.stopPropagation() // 阻止事件冒泡到播放器拖拽
  }
  if (audioRef.value && audioRef.value.duration) {
    // 限制拖拽最大进度为99%
    const limitedProgress = Math.min(99, progress.value)
    progress.value = limitedProgress
    audioRef.value.currentTime = (limitedProgress / 100) * audioRef.value.duration
  }
}

// 点击进度条跳转
const handleProgressClick = (e: MouseEvent) => {
  e.stopPropagation() // 阻止事件冒泡到播放器拖拽
  const progressSlider = e.target as HTMLInputElement
  if (!progressSlider || !audioRef.value || !audioRef.value.duration) return

  const rect = progressSlider.getBoundingClientRect()
  const percentage = (e.clientX - rect.left) / rect.width
  // 限制最大进度为99%，留出1%的空间防止直接触发结束
  const newProgress = Math.max(0, Math.min(0.99, percentage))

  progress.value = newProgress * 100
  audioRef.value.currentTime = newProgress * audioRef.value.duration
}

// 更新播放进度显示
const updateProgressDisplay = () => {
  if (audioRef.value && audioRef.value.duration) {
    progress.value = (audioRef.value.currentTime / audioRef.value.duration) * 100
    // 更新CSS变量用于进度条填充效果
    updateProgressFill()

    // 检查是否播放完成（包括手动拖拽到结尾的情况）
    if (progress.value >= 99 && isPlaying.value) {
      // 延迟触发，避免与拖拽操作冲突
      setTimeout(() => {
        if (progress.value >= 99 && isPlaying.value) {
          onEnded()
        }
      }, 100)
    }
  }
}

// 更新进度条填充效果
const updateProgressFill = () => {
  const progressSlider = document.querySelector('.progress-slider') as HTMLElement
  if (progressSlider) {
    progressSlider.style.setProperty('--progress', `${progress.value}%`)
  }
}


// 音量控制相关函数
const startVolumeDrag = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation() // 阻止事件冒泡到播放器拖拽
  isVolumeDragging.value = true
  updateVolumeFromMouse(e)

  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (isVolumeDragging.value) {
      updateVolumeFromMouse(moveEvent)
    }
  }

  const handleMouseUp = () => {
    isVolumeDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}


const updateVolumeFromMouse = (e: MouseEvent) => {
  if (!volumeControlRef.value) return

  const rect = volumeControlRef.value.getBoundingClientRect()
  const trackHeight = rect.height - 16 // 减去padding
  const relativeY = rect.bottom - e.clientY - 8 // 减去底部padding
  const percentage = Math.max(0, Math.min(1, relativeY / trackHeight))

  volume.value = percentage
  if (audioRef.value) {
    audioRef.value.volume = volume.value
  }

  // 如果音量从极低值调高，自动取消静音
  if (volume.value > 0.05 && isMuted.value) {
    isMuted.value = false
    if (audioRef.value) {
      audioRef.value.muted = false
    }
  }
}

const handleVolumeClick = (e: MouseEvent) => {
  e.stopPropagation() // 阻止事件冒泡到播放器拖拽
  updateVolumeFromMouse(e)
}

// 监听音量变化
watch(volume, (newVolume) => {
  if (audioRef.value) {
    audioRef.value.volume = newVolume
    // 如果音量从极低值调高，自动取消静音
    if (newVolume > 0.05 && isMuted.value) {
      isMuted.value = false
      audioRef.value.muted = false
    }
  }
})

const onPlay = () => {
  isPlaying.value = true
}

const onPause = () => {
  isPlaying.value = false
}

const onError = (e: Event) => {
  console.log('Audio error:', e)
  isPlaying.value = false
}

// 播放列表相关函数
const togglePlaylist = () => {
  showPlaylist.value = !showPlaylist.value
  console.log('Playlist toggled:', showPlaylist.value)
  console.log('Music list length:', musicList.value.length)
  console.log('Music list:', musicList.value)

  // 当显示播放列表时，触发列表项动画
  if (showPlaylist.value) {
    nextTick(() => {
      const items = document.querySelectorAll('.playlist-item')
      items.forEach((item, index) => {
        setTimeout(() => {
          item.classList.add('show')
        }, index * 50) // 每个列表项延迟50ms显示
      })
    })
  }
}



// 播放模式切换
const togglePlayMode = () => {
  const modes: PlayMode[] = ['singleLoop', 'listLoop', 'listOnce', 'random']
  const currentIndex = modes.indexOf(playMode.value)
  const nextIndex = (currentIndex + 1) % modes.length
  const newMode = modes[nextIndex]
  playMode.value = newMode
}

// 获取播放模式图标
const playModeIcon = computed(() => {
  switch (playMode.value) {
    case 'singleLoop':
      return '/music/icons/repeat-one-svgrepo-com.svg'
    case 'listLoop':
      return '/music/icons/repeat-svgrepo-com.svg'
    case 'listOnce':
      return '/music/icons/repeat-one-minimalistic-svgrepo-com.svg'
    case 'random':
      return '/music/icons/shuffle-svgrepo-com.svg'
    default:
      return '/music/icons/repeat-svgrepo-com.svg'
  }
})

// 获取播放模式标题
const getPlayModeTitle = () => {
  switch (playMode.value) {
    case 'singleLoop':
      return 'Single Loop'
    case 'listLoop':
      return 'List Loop'
    case 'listOnce':
      return 'Play Once'
    case 'random':
      return 'Random Play'
    default:
      return 'List Loop'
  }
}

// 处理播放结束事件
const onEnded = () => {
  // 根据播放模式处理下一首
  setTimeout(() => {
    if (musicList.value.length === 0) {
      isPlaying.value = false
      return
    }

    let willPlayNext = false

    switch (playMode.value) {
      case 'singleLoop':
        // 单曲循环，重新播放当前歌曲
        if (audioRef.value) {
          audioRef.value.currentTime = 0
          audioRef.value.play().then(() => {
            isPlaying.value = true
          }).catch(e => {
            console.log('Audio play failed:', e)
            isPlaying.value = false
          })
          willPlayNext = true
        }
        break

      case 'listLoop':
        // 列表循环，播放下一首，循环到第一首
        const currentIndex = musicList.value.findIndex(music => music.name === currentMusic.value)
        const nextIndex = (currentIndex + 1) % musicList.value.length

        if (nextIndex !== -1) {
          playMusic(musicList.value[nextIndex])
          willPlayNext = true
        }
        break

      case 'listOnce':
        // 列表单次播放，只在不是最后一首歌时播放下一首
        const currentIdx = musicList.value.findIndex(music => music.name === currentMusic.value)
        if (currentIdx < musicList.value.length - 1) {
          // 不是最后一首歌，播放下一首
          playMusic(musicList.value[currentIdx + 1])
          willPlayNext = true
        } else {
          // 是最后一首歌，停止播放
          isPlaying.value = false
        }
        break

      case 'random':
        // 智能随机播放
        const nextSongName = getNextRandomSong()
        if (nextSongName) {
          const nextSong = musicList.value.find(music => music.name === nextSongName)
          if (nextSong) {
            playMusic(nextSong)
            willPlayNext = true
          }
        } else {
          // 没有下一首歌了，停止播放
          isPlaying.value = false
        }
        break
    }

    // 如果没有播放下一首，才设置暂停状态
    if (!willPlayNext) {
      isPlaying.value = false
    }
  }, 100)
}

// 显示提示信息
const showHint = (text: string) => {
  hintText.value = text
  showNavHint.value = true

  // 清除之前的定时器
  if (hintTimeout) {
    clearTimeout(hintTimeout)
  }

  // 2秒后隐藏提示
  hintTimeout = setTimeout(() => {
    showNavHint.value = false
  }, 2000)
}

// 检查是否有上一首
const hasPrevious = () => {
  if (musicList.value.length <= 1) return false

  const currentIndex = musicList.value.findIndex(music => music.name === currentMusic.value)
  if (currentIndex === -1) return false

  // listOnce 模式：第一首歌没有上一首
  if (playMode.value === 'listOnce') {
    return currentIndex > 0
  }

  // 其他模式：循环播放，总有上一首
  return true
}

// 检查是否有下一首
const hasNext = () => {
  if (musicList.value.length <= 1) return false

  const currentIndex = musicList.value.findIndex(music => music.name === currentMusic.value)
  if (currentIndex === -1) return false

  // listOnce 模式：最后一首歌没有下一首
  if (playMode.value === 'listOnce') {
    return currentIndex < musicList.value.length - 1
  }

  // 其他模式：循环播放，总有下一首
  return true
}

// 播放上一首
const playPrevious = () => {
  if (!hasPrevious()) {
    showHint('No Previous Track')
    return
  }

  // 在随机模式下，上一首也是随机选择
  if (playMode.value === 'random') {
    const nextSongName = getNextRandomSong()
    if (nextSongName) {
      const nextSong = musicList.value.find(music => music.name === nextSongName)
      if (nextSong) {
        playMusic(nextSong)
      }
    } else {
      showHint('No available tracks')
    }
    return
  }

  const currentIndex = musicList.value.findIndex(music => music.name === currentMusic.value)
  if (currentIndex === -1) return

  let previousIndex

  switch (playMode.value) {
    case 'listOnce':
      previousIndex = currentIndex - 1
      break
    case 'listLoop':
    case 'singleLoop':
    default:
      // 循环模式：从最后一首开始
      previousIndex = currentIndex === 0 ? musicList.value.length - 1 : currentIndex - 1
      break
  }

  if (previousIndex >= 0 && previousIndex < musicList.value.length) {
    playMusic(musicList.value[previousIndex])
  }
}

// 播放下一首
const playNext = () => {
  if (!hasNext()) {
    showHint('No Next Track')
    return
  }

  // 在随机模式下，下一首也是随机选择
  if (playMode.value === 'random') {
    const nextSongName = getNextRandomSong()
    if (nextSongName) {
      const nextSong = musicList.value.find(music => music.name === nextSongName)
      if (nextSong) {
        playMusic(nextSong)
      }
    } else {
      showHint('No available tracks')
    }
    return
  }

  const currentIndex = musicList.value.findIndex(music => music.name === currentMusic.value)
  if (currentIndex === -1) return

  let nextIndex

  switch (playMode.value) {
    case 'listOnce':
      nextIndex = currentIndex + 1
      break
    case 'listLoop':
    case 'singleLoop':
    default:
      // 循环模式：从第一首开始
      nextIndex = currentIndex === musicList.value.length - 1 ? 0 : currentIndex + 1
      break
  }

  if (nextIndex >= 0 && nextIndex < musicList.value.length) {
    playMusic(musicList.value[nextIndex])
  }
}

// 播放选中的音乐
const playMusic = (music: {name: string, size: number}) => {
  currentMusic.value = music.name

  if (audioRef.value) {
    audioRef.value.load()
    audioRef.value.volume = volume.value // 确保音量设置正确
    audioRef.value.play().then(() => {
      isPlaying.value = true // 确保播放状态正确更新
    }).catch(e => {
      console.log('Audio play failed:', e)
      isPlaying.value = false
    })
  }
  // 播放后不自动关闭列表，让用户继续查看和选择
}

// 初始化随机播放列表（保留函数以避免错误，但简化逻辑）
const initRandomPlayList = () => {
  // 简化的随机播放不需要复杂的初始化
}

// 获取下一首随机歌曲
const getNextRandomSong = () => {
  // 简化逻辑：获取所有歌曲，排除当前歌曲
  const allSongs = musicList.value.map(music => music.name)
  const availableSongs = allSongs.filter(song => song !== currentMusic.value)

  // 如果没有可用的歌曲，返回null
  if (availableSongs.length === 0) {
    return null
  }

  // 随机选择一首歌
  const randomIndex = Math.floor(Math.random() * availableSongs.length)
  const selectedSong = availableSongs[randomIndex]

  return selectedSong
}

// 扫描音乐文件
const scanMusicFiles = async () => {
  try {
    // 常见的音频文件扩展名
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.wma']

    // 尝试从不同的可能位置扫描音乐文件
    const possiblePaths = [
      '/music/',
      '/audio/',
      '/sounds/',
      '/public/music/',
      '/public/audio/',
      '/public/sounds/'
    ]

    let musicFiles: Array<{name: string, size: number}> = []

    // 由于浏览器安全限制，我们无法直接扫描文件系统
    // 这里使用一个智能的策略：先尝试已知的文件，然后动态检测
    const knownFiles: string[] = [
      'ALL BGM CHANNEL,KAYOKO - FlowerGarden (feat. KAYOKO).flac',
      'ALL BGM CHANNEL,mimi - A Gentle Night (feat. mimi).flac',
      'ALL BGM CHANNEL,mimi - Improvisation (feat. mimi).flac',
      'ALL BGM CHANNEL,mimi - Looking Forward (feat. mimi).flac',
      'ALL BGM CHANNEL,mimi - Maybe We\'ll See A Rainbow (feat. mimi).flac',
      'ALL BGM CHANNEL,mimi - Waltz On A Rainy Day (feat. mimi).flac',
      'ALL BGM CHANNEL,MoppySound - Bouquet and Cafe (feat. MoppySound).flac',
      'ALL BGM CHANNEL,MoppySound - Cafe after the Rain (feat. MoppySound).flac',
      'ALL BGM CHANNEL,MoppySound - Coffee after the Rain (feat. MoppySound).flac',
      'ALL BGM CHANNEL,MoppySound - Heartwarming Coffee (feat. MoppySound).flac',
      'ALL BGM CHANNEL,MoppySound - Rain through the Window (feat. MoppySound).flac',
      'ALL BGM CHANNEL,MoppySound - wet Body and warm Coffee (feat. MoppySound).flac',
      'ALL BGM CHANNEL,MoppySound - Wet Bouquet (feat. MoppySound).flac',
      'ALL BGM CHANNEL,SHOHEI - A cup of coffee (feat. SHOHEI).flac'
    ]

    // 过滤出存在的文件（基于已知列表）
    musicFiles = knownFiles
      .map(filename => ({
        name: filename,
        size: estimateFileSize(filename)
      }))
      .filter(file => audioExtensions.some(ext => file.name.toLowerCase().endsWith(ext)))

    // 尝试动态检测音乐文件（通过检查文件是否存在）
    await detectMusicFiles(musicFiles, audioExtensions)

    musicList.value = musicFiles
    console.log('Music files loaded:', musicList.value)

    // 如果当前是随机模式，初始化随机播放列表
    if (playMode.value === 'random') {
      initRandomPlayList()
    }
  } catch (e) {
    console.log('Failed to scan music files:', e)
    musicList.value = []
  }
}

// 动态检测音乐文件
const detectMusicFiles = async (existingFiles: Array<{name: string, size: number}>, extensions: string[]) => {
  // 通过尝试加载文件来检测是否存在
  const testFiles: string[] = []

  for (const filename of testFiles) {
    if (!existingFiles.some(file => file.name === filename)) {
      try {
        const response = await fetch(`/music/${filename}`, { method: 'HEAD' })
        if (response.ok) {
          existingFiles.push({
            name: filename,
            size: estimateFileSize(filename)
          })
        }
      } catch (e) {
        // 文件不存在，忽略
      }
    }
  }

  // 尝试其他可能的路径
  const paths = ['/audio/', '/sounds/']
  for (const path of paths) {
    for (const filename of testFiles) {
      const fullPath = path + filename
      if (!existingFiles.some(file => file.name === filename)) {
        try {
          const response = await fetch(fullPath, { method: 'HEAD' })
          if (response.ok) {
            existingFiles.push({
              name: filename,
              size: estimateFileSize(filename)
            })
          }
        } catch (e) {
          // 文件不存在，忽略
        }
      }
    }
  }
}

// 自动刷新播放列表
const startAutoRefresh = () => {
  // 每30秒检查一次新文件
  autoRefreshInterval.value = setInterval(async () => {
    const oldCount = musicList.value.length
    await scanMusicFiles()
    const newCount = musicList.value.length

    // 如果有新文件，显示提示
    if (newCount > oldCount) {
      showHint(`发现 ${newCount - oldCount} 首新歌曲`)
    }
  }, 30000) // 30秒
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
    autoRefreshInterval.value = null
  }
}

// 手动刷新播放列表
const refreshPlaylist = async () => {
  const oldCount = musicList.value.length
  await scanMusicFiles()
  const newCount = musicList.value.length

  if (newCount > oldCount) {
    showHint(`已刷新，发现 ${newCount - oldCount} 首新歌曲`)
  } else if (newCount === oldCount) {
    showHint('播放列表已是最新')
  }
}

// 估算文件大小（基于文件类型）
const estimateFileSize = (filename: string) => {
  const sizeMap: Record<string, number> = {
    '青葉市子 - いきのこり●ぼくら.flac': 190955496,
  }

  // 如果文件在映射表中，返回实际大小
  if (sizeMap[filename]) {
    return sizeMap[filename]
  }

  // 否则根据扩展名估算大小
  const ext = filename.toLowerCase().split('.').pop()
  const defaultSizes: Record<string, number> = {
    'mp3': 8 * 1024 * 1024,  // 8MB
    'wav': 20 * 1024 * 1024, // 20MB
    'flac': 25 * 1024 * 1024, // 25MB
    'ogg': 6 * 1024 * 1024,   // 6MB
    'm4a': 7 * 1024 * 1024,   // 7MB
    'aac': 6 * 1024 * 1024,   // 6MB
    'wma': 5 * 1024 * 1024,   // 5MB
  }

  return defaultSizes[ext || ''] || 5 * 1024 * 1024 // 默认5MB
}

// 根据音量状态返回相应的喇叭图标
const speakerIcon = computed(() => {
  if (isMuted.value) {
    return '/music/icons/speaker-zzz-fill-svgrepo-com.svg'
  }

  if (volume.value <= 0.05) {
    return '/music/icons/speaker-fill-svgrepo-com.svg'
  } else if (volume.value <= 0.3) {
    return '/music/icons/speaker-1-fill-svgrepo-com.svg'
  } else if (volume.value <= 0.7) {
    return '/music/icons/speaker-2-fill-svgrepo-com.svg'
  } else {
    return '/music/icons/speaker-3-fill-svgrepo-com.svg'
  }
})

// 保存位置到localStorage
const savePosition = (pos: { x: number; y: number }) => {
  try {
    localStorage.setItem('musicPlayerPosition', JSON.stringify(pos))
  } catch (e) {
    console.log('Failed to save position:', e)
  }
}

// 从localStorage加载位置
const loadPosition = () => {
  try {
    const saved = localStorage.getItem('musicPlayerPosition')
    if (saved) {
      const pos = JSON.parse(saved)
      // 确保位置在可视区域内
      const maxX = window.innerWidth - 500 // 播放器宽度约500px
      const maxY = window.innerHeight - 60 // 播放器高度约60px

      position.value = {
        x: Math.max(0, Math.min(pos.x, maxX)),
        y: Math.max(0, Math.min(pos.y, maxY))
      }
    }
  } catch (e) {
    console.log('Failed to load position:', e)
  }
}

// 开始拖动
const startDrag = (e: MouseEvent | TouchEvent) => {
  // 如果点击的是控制按钮、音量控制区域或进度条，不触发拖动
  if ((e.target as HTMLElement).closest('.control-btn, .volume-control-vertical, .progress-control')) {
    return
  }

  isDragging.value = true

  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

  dragOffset.value = {
    x: clientX - position.value.x,
    y: clientY - position.value.y
  }

  let animationId: number

  const handleDrag = (moveEvent: MouseEvent | TouchEvent) => {
    if (!isDragging.value) return

    const moveClientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX
    const moveClientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY

    const newX = moveClientX - dragOffset.value.x
    const newY = moveClientY - dragOffset.value.y

    // 使用 requestAnimationFrame 优化性能
    if (animationId) {
      cancelAnimationFrame(animationId)
    }

    animationId = requestAnimationFrame(() => {
      // 限制在窗口范围内
      const maxX = window.innerWidth - 500
      const maxY = window.innerHeight - 60

      position.value = {
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      }
    })
  }

  const stopDrag = () => {
    if (isDragging.value) {
      isDragging.value = false
      savePosition(position.value)
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }

  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', handleDrag, { passive: false })
  document.addEventListener('touchend', stopDrag)

  // 防止拖动时选中文本和页面滚动
  e.preventDefault()
}

// 点击其他地方隐藏音量条
const handleClickOutside = (e: MouseEvent) => {
  const volumeControl = document.querySelector('.volume-control-vertical')
  const speakerButton = document.querySelector('[title*="Volume"], [title*="Mute"]')
  const musicPlayer = document.querySelector('.music-player')

  // 处理音量控制的关闭
  if (showVolumeControl.value &&
      volumeControl &&
      !volumeControl.contains(e.target as Node) &&
      !speakerButton?.contains(e.target as Node)) {
    showVolumeControl.value = false
  }

  // 处理播放列表的关闭 - 点击音乐播放器外部时关闭
  if (showPlaylist.value &&
      musicPlayer &&
      !musicPlayer.contains(e.target as Node)) {
    showPlaylist.value = false
  }
}

// 键盘控制音量和进度
const handleKeyDown = (e: KeyboardEvent) => {
  const volumeStep = 0.05 // 每次按键调整的音量步长

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault()
      handleProgressKeyAdjust('left', e.repeat)
      break

    case 'ArrowRight':
      e.preventDefault()
      handleProgressKeyAdjust('right', e.repeat)
      break

    case 'ArrowUp':
      e.preventDefault()
      volume.value = Math.min(1, volume.value + volumeStep)
      if (audioRef.value) {
        audioRef.value.volume = volume.value
      }
      // 如果音量从极低值调高，自动取消静音
      if (volume.value > 0.05 && isMuted.value) {
        isMuted.value = false
        if (audioRef.value) {
          audioRef.value.muted = false
        }
      }
      break

    case 'ArrowDown':
      e.preventDefault()
      volume.value = Math.max(0, volume.value - volumeStep)
      if (audioRef.value) {
        audioRef.value.volume = volume.value
      }
      break

    case ' ':
      e.preventDefault()
      togglePlay()
      break

    case 'Escape':
      e.preventDefault()
      if (showVolumeControl.value) {
        showVolumeControl.value = false
      }
      break
  }
}

// 处理键盘进度调整
const handleProgressKeyAdjust = (direction: 'left' | 'right', isRepeat: boolean) => {
  if (!audioRef.value?.duration) return

  // 快进/快退的倍率
  const fastForwardRate = 2.0 // 2倍速
  const rewindRate = -2.0 // -2倍速（反向播放）

  // 如果是第一次按键（非重复按键）
  if (!isRepeat && !isKeyAdjustingProgress.value) {
    // 开始按键调整进度
    isKeyAdjustingProgress.value = true
    keyAdjustmentStartTime.value = Date.now()
    currentDirection.value = direction

    // 记录原始播放速度
    originalPlaybackRate.value = audioRef.value!.playbackRate

    // 设置播放速度和方向
    const targetRate = direction === 'right' ? fastForwardRate : rewindRate

    if (isPlaying.value) {
      audioRef.value!.playbackRate = targetRate
    } else {
      // 如果没有播放，先开始播放
      audioRef.value.play().then(() => {
        audioRef.value!.playbackRate = targetRate
      }).catch(e => {
        console.log('Audio play failed:', e)
      })
    }

    // 监听按键释放事件
    const handleKeyUp = () => {
      finishProgressKeyAdjust()
      document.removeEventListener('keyup', handleKeyUp)
    }

    document.addEventListener('keyup', handleKeyUp)

    console.log('开始快进/快退，方向:', direction, '倍率:', targetRate)
  }

  // 如果是重复按键，更新方向
  if (isRepeat) {
    currentDirection.value = direction
  }
}

// 完成键盘进度调整
const finishProgressKeyAdjust = () => {
  if (!isKeyAdjustingProgress.value || !audioRef.value) return

  console.log('结束快进/快退')

  // 恢复原始播放速度
  audioRef.value!.playbackRate = originalPlaybackRate.value

  // 清理定时器
  if (keyRepeatTimer) {
    clearInterval(keyRepeatTimer)
    keyRepeatTimer = null
  }

  // 重置状态
  isKeyAdjustingProgress.value = false
}

// 检测是否为移动设备
const checkMobile = () => {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
}

// 隐藏播放器到边缘
const hidePlayer = () => {
  if (isMobile.value) {
    isHidden.value = true
  }
}

// 显示播放器
const showPlayer = () => {
  if (isMobile.value) {
    isHidden.value = false
    // 3秒后自动隐藏
    if (hideTimeout.value) {
      clearTimeout(hideTimeout.value)
    }
    hideTimeout.value = setTimeout(() => {
      hidePlayer()
    }, 3000)
  }
}

// 重写开始拖动函数
const startDrag = (e: MouseEvent | TouchEvent) => {
  if (isMobile.value && isHidden.value) {
    showPlayer()
    return
  }

  isDragging.value = true
  const touch = e instanceof TouchEvent ? e.touches[0] : e as MouseEvent
  dragOffset.value = {
    x: touch.clientX - position.value.x,
    y: touch.clientY - position.value.y
  }
  e.preventDefault()
}

onMounted(async () => {
  // 检测移动设备
  checkMobile()

  // 如果没有保存的位置，设置默认位置到搜索按钮附近
  const saved = localStorage.getItem('musicPlayerPosition')
  if (!saved) {
    // 设置位置：搜索按钮的X轴（距离右边50px），创作者信息行的Y轴
    position.value = {
      x: window.innerWidth - 550, // 播放器宽度500px + 距离右边50px
      y: 900 // 创作者信息行的大致Y轴位置
    }
  }

  // 加载保存的位置
  loadPosition()

  // 触发渐隐显示动画
  setTimeout(() => {
    isMounted.value = true
  }, 100)

  // 扫描音乐文件
  await scanMusicFiles()

  // 启动自动刷新
  startAutoRefresh()

  // 随机选择第一首歌
  if (musicList.value.length > 0) {
    const randomIndex = Math.floor(Math.random() * musicList.value.length)
    const selectedMusic = musicList.value[randomIndex]
    currentMusic.value = selectedMusic.name
    console.log('Set random default music to:', selectedMusic.name)

    // 如果当前是随机模式，初始化随机播放列表
    if (playMode.value === 'random') {
      initRandomPlayList()
    }
  }

  // 监听窗口大小变化，调整位置
  const handleResize = () => {
    const maxX = window.innerWidth - 500
    const maxY = window.innerHeight - 60

    position.value = {
      x: Math.max(0, Math.min(position.value.x, maxX)),
      y: Math.max(0, Math.min(position.value.y, maxY))
    }
  }

  // 添加全局点击事件来"唤醒"音频
  const handleGlobalClick = () => {
    if (audioRef.value && isPlaying.value && audioRef.value.volume > 0) {
      // 如果显示播放但可能没有声音，重新设置音量
      const currentVolume = audioRef.value.volume
      audioRef.value.volume = 0
      setTimeout(() => {
        if (audioRef.value) {
          audioRef.value.volume = currentVolume
        }
      }, 10)
    }
  }

  window.addEventListener('resize', handleResize)
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('click', handleGlobalClick, { once: true }) // 只触发一次

  // 设置初始音量
  if (audioRef.value) {
    audioRef.value.volume = volume.value
    audioRef.value.muted = isMuted.value

    // 添加时间更新监听器
    audioRef.value.addEventListener('timeupdate', updateProgressDisplay)

    // 初始化进度条填充效果
    updateProgressFill()

    // 尝试自动播放
    const attemptPlay = () => {
      audioRef.value?.play().then(() => {
        console.log('Audio autoplay succeeded')
        isPlaying.value = true
      }).catch(e => {
        console.log('Audio autoplay failed:', e)

        // 策略1: 先静音播放，然后取消静音
        if (audioRef.value) {
          const originalVolume = audioRef.value.volume
          audioRef.value.volume = 0 // 静音
          audioRef.value.play().then(() => {
            console.log('Audio autoplay succeeded with mute strategy')
            isPlaying.value = true

            // 播放成功后恢复音量
            setTimeout(() => {
              if (audioRef.value) {
                audioRef.value.volume = originalVolume
              }
            }, 100)
          }).catch(() => {
            console.log('Muted autoplay also failed, waiting for user interaction')
            setupUserInteractionListener()
          })
        }
      })
    }

    // 设置用户交互监听器
    const setupUserInteractionListener = () => {
      const tryPlayOnInteraction = () => {
        if (audioRef.value && !isPlaying.value) {
          audioRef.value.play().then(() => {
            console.log('Audio autoplay succeeded after user interaction')
            isPlaying.value = true
            // 用户交互后，重新设置音量来"唤醒"音频
            const currentVolume = audioRef.value.volume
            audioRef.value.volume = 0
            setTimeout(() => {
              if (audioRef.value) {
                audioRef.value.volume = currentVolume
              }
            }, 50)
          }).catch(() => {
            console.log('Audio play failed after user interaction')
          })
        }
        // 移除所有事件监听器
        document.removeEventListener('click', tryPlayOnInteraction)
        document.removeEventListener('touchstart', tryPlayOnInteraction)
        document.removeEventListener('keydown', tryPlayOnInteraction)
        document.removeEventListener('scroll', tryPlayOnInteraction)
      }

      // 监听多种用户交互事件
      document.addEventListener('click', tryPlayOnInteraction, { once: true })
      document.addEventListener('touchstart', tryPlayOnInteraction, { once: true })
      document.addEventListener('keydown', tryPlayOnInteraction, { once: true })
      document.addEventListener('scroll', tryPlayOnInteraction, { once: true })
    }

    // 首次尝试播放
    attemptPlay()

    // 延迟再次尝试，给页面加载时间
    setTimeout(() => {
      if (!isPlaying.value) {
        attemptPlay()
      }
    }, 1000)

    // 再延迟一次尝试
    setTimeout(() => {
      if (!isPlaying.value) {
        attemptPlay()
      }
    }, 2000)
  }

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    document.removeEventListener('click', handleClickOutside)
    if (audioRef.value) {
      audioRef.value.removeEventListener('timeupdate', updateProgressDisplay)
    }
    // 清理提示定时器
    if (hintTimeout) {
      clearTimeout(hintTimeout)
    }
    // 清理键盘调整定时器
    if (keyRepeatTimer) {
      clearTimeout(keyRepeatTimer)
    }
    // 清理隐藏定时器
    if (hideTimeout.value) {
      clearTimeout(hideTimeout.value)
    }
    // 停止自动刷新
    stopAutoRefresh()
  })

  // 如果是移动设备，设置边缘隐藏
  if (isMobile.value) {
    setTimeout(() => {
      hidePlayer()
    }, 5000) // 5秒后自动隐藏
  }
})
})
</script>

<style scoped>
.music-player {
  position: fixed;
  z-index: 1000;
  user-select: none;
  -webkit-user-select: none;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
  border-radius: 0;
  overflow: visible;
  will-change: transform, box-shadow, opacity, filter;
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;

  /* 初始状态：模糊且半透明 */
  opacity: 0;
  transform: scale(0.95) translateZ(0);
  filter: blur(8px) brightness(0.8);
}

.music-player.mounted {
  /* 触发模糊到清晰动画 */
  animation: blurReveal 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

.music-player.dragging {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  transform: scale(1.05) translateZ(0);
  transition: box-shadow 0.15s ease, transform 0.08s ease;
}

.music-player:not(.dragging) {
  transition: box-shadow 0.3s ease, transform 0.2s ease;
}

.music-player:focus {
  outline: 2px solid rgba(59, 130, 246, 0.8);
  outline-offset: 2px;
}

.music-player:focus-visible {
  outline: 2px solid rgba(59, 130, 246, 1);
  outline-offset: 2px;
}

.music-player:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  transform: scale(1.02) translateZ(0);
}

/* 移动端边缘隐藏状态 */
.music-player.mobile-hidden {
  cursor: pointer;
  border-right: 3px solid rgba(255, 255, 255, 0.6);
  border-radius: 0 8px 8px 0;
}

.music-player.mobile-hidden .music-controls {
  overflow: hidden;
}

.music-player.mobile-hidden .music-controls::before {
  content: '♪';
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

.music-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  padding: 8px 16px;
  border-radius: 0;
  transition: all 0.3s ease;
  cursor: grab;
  width: 400px;
  height: 100%;
  box-sizing: border-box;
  border: none;
  box-shadow: none;
}

.dark .music-controls {
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: none;
  box-shadow: none;
}

.control-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.control-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.dark .control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.play-icon {
  width: 0;
  height: 0;
  border-left: 8px solid #333;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  margin-left: 2px;
}

.dark .play-icon {
  border-left-color: #fff;
}

.pause-icon {
  width: 12px;
  height: 12px;
  display: flex;
  gap: 3px;
}

.pause-icon::before,
.pause-icon::after {
  content: '';
  width: 3px;
  height: 12px;
  background: #333;
}

.dark .pause-icon::before,
.dark .pause-icon::after {
  background: #fff;
}

.mute-icon {
  width: 20px;
  height: 20px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* SVG图标样式 */
.icon-svg {
  width: 20px;
  height: 20px;
  pointer-events: none;
  filter: brightness(0);
}

.dark .icon-svg {
  filter: brightness(1);
}

/* 导航按钮图标样式 */
.nav-icon {
  width: 16px;
  height: 16px;
  transition: opacity 0.2s ease;
}

.nav-icon.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 提示对话框样式 */
.nav-hint {
  position: absolute;
  top: 100%;
  right: 20px;
  margin-top: 8px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 0;
  border: none;
  padding: 8px 12px;
  box-shadow: none;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 2000;
  white-space: nowrap;

  /* 移除动画效果 */
  transform-origin: top right;
}

.nav-hint.show {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.dark .nav-hint {
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: none;
  box-shadow: none;
}

.hint-icon {
  width: 14px;
  height: 14px;
  filter: brightness(0);
}

.dark .hint-icon {
  filter: brightness(1);
}

.hint-text {
  font-size: 11px;
  font-weight: bold;
  color: #333;
}

.dark .hint-text {
  color: #fff;
}

/* 播放进度条 */
.progress-control {
  display: flex;
  align-items: center;
  flex: 2;
  margin: 0 12px;
  position: relative;
}

.progress-slider {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  outline: none;
  cursor: pointer;
  transition: height 0.2s ease;
}

.progress-slider:hover {
  height: 10px;
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #333;
  border-radius: 50%;
  cursor: grab;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.progress-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.progress-slider::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.1);
}

.dark .progress-slider {
  background: #555;
}

.dark .progress-slider::-webkit-slider-thumb {
  background: #fff;
  width: 16px;
  height: 16px;
}

/* 进度条填充效果 */
.progress-slider {
  --progress: 0%;
  background: linear-gradient(to right, #333 0%, #333 var(--progress), rgba(0, 0, 0, 0.1) var(--progress), rgba(0, 0, 0, 0.1) 100%);
}

.dark .progress-slider {
  --progress: 0%;
  background: linear-gradient(to right, #fff 0%, #fff var(--progress), rgba(255, 255, 255, 0.1) var(--progress), rgba(255, 255, 255, 0.1) 100%);
}

/* 模糊到清晰渐现动画 */
@keyframes blurReveal {
  0% {
    opacity: 0;
    transform: scale(0.95) translateZ(0);
    filter: blur(8px) brightness(0.8);
  }
  25% {
    opacity: 0.4;
    transform: scale(0.97) translateZ(0);
    filter: blur(4px) brightness(0.9);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.99) translateZ(0);
    filter: blur(2px) brightness(0.95);
  }
  75% {
    opacity: 0.9;
    transform: scale(1) translateZ(0);
    filter: blur(0.5px) brightness(1);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateZ(0);
    filter: blur(0px) brightness(1);
  }
}

/* 垂直音量条 */
.volume-control-vertical {
  position: absolute;
  bottom: 100%;
  left: 50%;
  margin-left: -130px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 0;
  padding: 8px 12px;
  border: none;
  box-shadow: none;
  z-index: 2000;

  /* 移除动画效果 */
  transform-origin: bottom center;
}

.volume-control-vertical.show {
  opacity: 1;
  transform: scaleY(1) translateY(0);
}

.dark .volume-control-vertical {
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: none;
  box-shadow: none;
}

/* 音量轨道 */
.volume-track {
  width: 6px;
  height: 45px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  position: relative;
  margin: 0 auto;
  overflow: hidden;
  transition: width 0.2s ease;
  cursor: pointer;
}

.volume-track:hover {
  width: 8px;
}

/* 音量填充 */
.volume-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, #333, #666);
  border-radius: 10px;
  transition: height 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

.dark .volume-track {
  background: rgba(255, 255, 255, 0.1);
}

.dark .volume-fill {
  background: linear-gradient(to top, #fff, #ccc);
  box-shadow: inset 0 1px 3px rgba(255, 255, 255, 0.3);
}


.hidden {
  display: none;
}




/* 响应式设计 */
/* 播放列表样式 */
.music-playlist {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 0;
  border: none;
  box-shadow: none;
  max-height: 300px;
  overflow-y: auto;
  z-index: 2000;
  min-width: 250px;

  /* 移除动画效果 */
  transform-origin: top center;
}

.music-playlist.show {
  opacity: 1;
  transform: scaleY(1) translateY(0);
}

.dark .music-playlist {
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: none;
  box-shadow: none;
}

.playlist-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease, opacity 0.3s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  opacity: 0;
  transform: translateY(-10px);
}

.playlist-item:last-child {
  border-bottom: none;
}

.playlist-item.show {
  opacity: 1;
  transform: translateY(0);
}

.playlist-item:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.dark .playlist-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.playlist-item.active {
  background: rgba(0, 0, 0, 0.1);
  color: #007aff;
}

.dark .playlist-item.active {
  background: rgba(255, 255, 255, 0.15);
  color: #0a84ff;
}

.playlist-header {
  padding: 12px 16px;
  font-weight: bold;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.dark .playlist-header {
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.music-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.music-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .music-player {
    bottom: 10px;
    right: 10px;
  }

  .music-controls {
    padding: 6px 12px;
    width: 420px;
  }

  .volume-slider {
    width: 50px;
  }

  .music-playlist {
    max-height: 250px;
  }
}
</style>
