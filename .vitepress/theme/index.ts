import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import giscusTalk from 'vitepress-plugin-comment-with-giscus';
import { useData, useRoute } from 'vitepress';
import { toRefs, watch } from "vue";
import { h, defineAsyncComponent } from 'vue'



import {
  InjectionKey as NolebaseEnhancedReadabilitiesInjectionKey,
  LayoutMode as NolebaseEnhancedReadabilitiesLayoutMode,
  NolebaseEnhancedReadabilitiesMenu,
  NolebaseEnhancedReadabilitiesScreenMenu,
} from '@nolebase/vitepress-plugin-enhanced-readabilities/client'

import {
  NolebaseInlineLinkPreviewPlugin,
} from '@nolebase/vitepress-plugin-inline-link-preview/client'

import {
  NolebaseHighlightTargetedHeading,
} from '@nolebase/vitepress-plugin-highlight-targeted-heading/client'

import {
  InjectionKey as NolebaseGitChangelogInjectionKey,
  NolebaseGitChangelogPlugin,
} from '@nolebase/vitepress-plugin-git-changelog/client'

import {
  NolebasePagePropertiesPlugin,
} from '@nolebase/vitepress-plugin-page-properties/client'

import {
  NolebaseUnlazyImg,
} from '@nolebase/vitepress-plugin-thumbnail-hash/client'

import { creators } from '../creators'

import AppContainer from './components/AppContainer.vue'
import DocFooter from './components/DocFooter.vue'
import HomePage from './components/HomePage.vue'
import Share from './components/Share.vue'
import TocList from './components/TocList.vue'

// Lazy load heavy components for better performance
const VideoBackground = defineAsyncComponent(() => import('./components/VideoBackground.vue'))
const MusicPlayer = defineAsyncComponent(() => import('./components/MusicPlayer.vue'))

import '@nolebase/vitepress-plugin-enhanced-readabilities/client/style.css'
import '@nolebase/vitepress-plugin-highlight-targeted-heading/client/style.css'
import '@nolebase/vitepress-plugin-inline-link-preview/client/style.css'
import '@nolebase/vitepress-plugin-git-changelog/client/style.css'
import '@nolebase/vitepress-plugin-page-properties/client/style.css'
import '@nolebase/vitepress-plugin-thumbnail-hash/client/style.css'
import '@nolebase/vitepress-plugin-enhanced-mark/client/style.css'

import 'virtual:uno.css'

import '../styles/main.css'
import '../styles/vars.css'

import('@nolebase/vitepress-plugin-inline-link-preview/client')

const ExtendedTheme: Theme = {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'layout-top': () => [
        h(VideoBackground),
        h(MusicPlayer),
      ],
      'doc-top': () => [
        h(NolebaseHighlightTargetedHeading),
      ],
      'doc-footer-before': () => [
        h(DocFooter),
      ],
      'nav-bar-content-after': () => [
        h(NolebaseEnhancedReadabilitiesMenu),
        h(Share),
      ],
      'nav-screen-content-after': () => [
        h(NolebaseEnhancedReadabilitiesScreenMenu),
      ],
    })
  },
  enhanceApp({ app }) {
    /**
     * Have to manually import and register the essential components that needed during build globally.
     *
     * Learn more at: Warn `Hydration completed but contains mismatches.` and Custom components are not rendered · Issue #1918 · vuejs/vitepress
     * https://github.com/vuejs/vitepress/issues/1918
     */

    app.component('HomePage', HomePage)
    app.component('DocFooter', DocFooter)
    app.component('Share', Share)
    app.component('TocList', TocList)
    app.component('AppContainer', AppContainer)
    app.component('VideoBackground', VideoBackground)
    app.component('MusicPlayer', MusicPlayer)
    app.component('NolebaseUnlazyImg', NolebaseUnlazyImg)

    app.provide(NolebaseEnhancedReadabilitiesInjectionKey, {
      layoutSwitch: {
        defaultMode: NolebaseEnhancedReadabilitiesLayoutMode.SidebarWidthAdjustableOnly,
      },
      spotlight: {
        defaultToggle: true,
        hoverBlockColor: 'rgb(240 197 52 / 7%)',
      },
    })

    app.provide(NolebaseGitChangelogInjectionKey, {
      mapContributors: creators,
      contributors: creators,
    })

    app.use(NolebaseInlineLinkPreviewPlugin)
    app.use(NolebaseGitChangelogPlugin)
    app.use(NolebasePagePropertiesPlugin<{
      tags: string[]
      progress: number
    }>(), {
      properties: {
        'en-US': [
          {
            key: 'tags',
            type: 'tags',
            title: 'Tags',
          },
          {
            key: 'progress',
            type: 'progress',
            title: 'Progress',
          },
          {
            key: 'wordCount',
            type: 'dynamic',
            title: 'Word Count',
            options: {
              type: 'wordsCount',
            },
          },
          {
            key: 'readingTime',
            type: 'dynamic',
            title: 'Reading Time',
            options: {
              type: 'readingTime',
              dateFnsLocaleName: 'enUS',
            },
          },
        ],
      },
    })
  },
  setup() {
    // Get frontmatter and route
    const { frontmatter, isDark } = toRefs(useData());
    const route = useRoute();

    // 主题初始化，默认日间模式但允许用户切换
    const initializeTheme = () => {
      if (typeof document !== 'undefined') {
        const html = document.documentElement;

        // 移除可能存在的媒体查询监听器，阻止浏览器自动切换
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (mediaQuery.removeEventListener) {
          // 移除现有的监听器（如果存在）
          mediaQuery.removeEventListener('change', () => {});
        }
      }
    };

    // 初始化主题
    initializeTheme();

    // 移除系统主题监听，避免浏览器自动切换干扰
    // appearance: 'light' 配置会阻止浏览器自动切换

    // Obtain configuration from: https://giscus.app/
    giscusTalk({
      repo: 'Jackiexiao/nolebase-template',
      repoId: 'R_kgDOL5WHsg',
      category: 'Announcements', // default: `General`
      categoryId: 'DIC_kwDOL5WHss4CfTYs',
      mapping: 'pathname', // default: `pathname`
      inputPosition: 'top', // default: `top`
      lang: 'en', // default: `zh-CN`
      reactionsEnabled: false, // 禁用反应功能
      emitMetadata: false, // 不发送元数据
      // i18n setting (Note: This configuration will override the default language set by lang)
      // Configured as an object with key-value pairs inside:
      // [your i18n configuration name]: [corresponds to the language pack name in Giscus]
      locales: {
          'zh-Hans': 'zh-CN',
          'en-US': 'en'
      },
      homePageShowComment: false, // Whether to display the comment area on the homepage, the default is false
      lightTheme: 'light', // default: `light`
      darkTheme: 'transparent_dark', // default: `transparent_dark`
      // ...
    }, {
      frontmatter, route
    },
      // Whether to activate the comment area on all pages.
      // Set to false to disable comments by default.
      // You can use `comment: true` preface to enable it separately on the page.
      false
    );
  }
}

export default ExtendedTheme
