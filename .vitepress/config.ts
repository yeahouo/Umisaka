import process from 'node:process'
import { defineConfig } from 'vitepress'
import MarkdownItFootnote from 'markdown-it-footnote'
import MarkdownItMathjax3 from 'markdown-it-mathjax3'

import { BiDirectionalLinks } from '@nolebase/markdown-it-bi-directional-links'
import { InlineLinkPreviewElementTransform } from '@nolebase/vitepress-plugin-inline-link-preview/markdown-it'
import { buildEndGenerateOpenGraphImages } from '@nolebase/vitepress-plugin-og-image/vitepress'
import { UnlazyImages } from '@nolebase/markdown-it-unlazy-img'

import { discordLink, githubRepoLink, siteDescription, siteName, targetDomain } from '../metadata'
import { creatorNames, creatorUsernames } from './creators'
import { sidebar } from './docsMetadata.json'

export default defineConfig({
  vue: {
    template: {
      transformAssetUrls: {
        video: ['src', 'poster'],
        source: ['src'],
        img: ['src'],
        image: ['xlink:href', 'href'],
        use: ['xlink:href', 'href'],
        NolebaseUnlazyImg: ['src'],
      },
    },
  },
  lang: 'en-US',
  title: siteName,
  description: siteDescription,
  ignoreDeadLinks: true,
  head: [
    ['meta', {
      name: 'theme-color',
      content: '#ffffff',
    }],
    [
      'link',
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon.png',
        sizes: '180x180',
      },
    ],
    ['link', {
      rel: 'icon',
      href: '/logo.svg',
      type: 'image/svg+xml',
    }],
    [
      'link',
      {
        rel: 'alternate icon',
        href: '/favicon.ico',
        type: 'image/png',
        sizes: '16x16',
      },
    ],
    ['meta', {
      name: 'author',
      content: creatorNames.join(', '),
    }],
    [
      'meta',
      {
        name: 'keywords',
        content:
          ['markdown', 'knowledge-base', 'knowledge management', 'vitepress', 'obsidian', 'notebook', 'notes', ...creatorUsernames].join(', '),
      },
    ],

    ['meta', {
      property: 'og:title',
      content: siteName,
    }],
    [
      'meta',
      {
        property: 'og:image',
        content: `${targetDomain}/og.png`,
      },
    ],
    ['meta', {
      property: 'og:description',
      content: siteDescription,
    }],
    ['meta', {
      property: 'og:site_name',
      content: siteName,
    }],

    ['meta', {
      name: 'twitter:card',
      content: 'summary_large_image',
    }],
    ['meta', {
      name: 'twitter:creator',
      content: creatorUsernames.join(', '),
    }],
    [
      'meta',
      {
        name: 'twitter:image',
        content: `${targetDomain}/og.png`,
      },
    ],

    [
      'link',
      {
        rel: 'mask-icon',
        href: '/safari-pinned-tab.svg',
        color: '#927baf',
      },
    ],
    ['link', {
      rel: 'manifest',
      href: '/site.webmanifest',
    }],
    ['meta', {
      name: 'msapplication-TileColor',
      content: '#603cba',
    }],
    // Google Fonts for Gothic style
    ['link', {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com',
    }],
    ['link', {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossorigin: '',
    }],
    ['link', {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Cinzel+Decorative:wght@700&family=MedievalSharp&family=Gothic+A1&family=Pirata+One&family=Tangerine:wght@700&family=Philosopher:wght@700&display=swap',
    }],
    // Proxying Plausible through Netlify | Plausible docs
    // https://plausible.io/docs/proxy/guides/netlify
    ['script', { 'defer': 'true', 'data-domain': 'nolebase.ayaka.io', 'data-api': '/api/v1/page-external-data/submit', 'src': '/assets/page-external-data/js/script.js' }],
  ],
  themeConfig: {
    outline: { label: 'Outline', level: 'deep' },
    darkModeSwitchLabel: 'Toggle Theme',
    editLink: {
      pattern: `${githubRepoLink}/tree/main/:path`,
      text: 'Edit this page',
    },
    socialLinks: [
      { icon: 'github', link: githubRepoLink },
      { icon: 'discord', link: discordLink },
    ],
    footer: {
      message: 'Written with <span style="color: #e25555;">&#9829;</span>',
      copyright:
        '<a class="footer-cc-link" target="_blank" href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a> © 2022-PRESENT Umisaka creators',
    },
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: 'Search',
                buttonAriaLabel: 'Search',
              },
              modal: {
                noResultsText: 'No results found',
                resetButtonTitle: 'Clear search query',
                footer: {
                  selectText: 'select',
                  navigateText: 'navigate',
                },
              },
            },
          },
        },

        // Add title ang tags field in frontmatter to search
        // You can exclude a page from search by adding search: false to the page's frontmatter.
        _render(src, env, md) {
          // without `md.render(src, env)`, the some information will be missing from the env.
          let html = md.render(src, env)
          let tagsPart = ''
          let headingPart = ''
          let contentPart = ''
          let fullContent = ''
          const sortContent = () => [headingPart, tagsPart, contentPart] as const
          let { frontmatter, content } = env

          if (!frontmatter)
            return html

          if (frontmatter.search === false)
            return ''

          contentPart = content ||= src

          const headingMatch = content.match(/^#{1} .*/m)
          const hasHeading = !!(headingMatch && headingMatch[0] && headingMatch.index !== undefined)

          if (hasHeading) {
            const headingEnd = headingMatch.index! + headingMatch[0].length
            headingPart = content.slice(0, headingEnd)
            contentPart = content.slice(headingEnd)
          }
          else if (frontmatter.title) {
            headingPart = `# ${frontmatter.title}`
          }

          const tags = frontmatter.tags
          if (tags && Array.isArray(tags) && tags.length)
            tagsPart = `Tags: #${tags.join(', #')}`

          fullContent = sortContent().filter(Boolean).join('\n\n')

          html = md.render(fullContent, env)

          return html
        },
      },
    },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Notes', link: '/笔记/' },
      { text: 'Recent Updates', link: '/toc' },
    ],
    sidebar,
  },
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'one-dark-pro',
    },
    math: true,
    config: (md) => {
      md.use(MarkdownItFootnote)
      md.use(MarkdownItMathjax3)
      md.use(BiDirectionalLinks({
        dir: process.cwd(),
      }))
      md.use(UnlazyImages(), {
        imgElementTag: 'NolebaseUnlazyImg',
      })
      md.use(InlineLinkPreviewElementTransform, {
        tag: 'VPNolebaseInlineLinkPreview',
      })
    },
  },
  async buildEnd(siteConfig) {
    await buildEndGenerateOpenGraphImages({
      baseUrl: targetDomain,
      category: {
        byLevel: 2,
      },
    })(siteConfig)
  },
})
