import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'AI System Design Guide',
  tagline: 'The complete interview and production reference for AI systems',
  favicon: 'img/favicon.ico',

  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Production url. Update organizationName / projectName / url / baseUrl in M6
  // once the GitHub Pages repo is known. For a project site the baseUrl is
  // usually '/<repo>/'; for local builds '/' is fine.
  url: 'https://jack51706.github.io',
  baseUrl: '/ai-system-design-guide/',
  organizationName: 'jack51706',
  projectName: 'ai-system-design-guide',

  // Existing content has many cross-file relative links and TOC anchors that do
  // not all resolve yet. Keep these as warnings so the build completes; tighten
  // to 'throw' in M7 after the links are cleaned up.
  onBrokenLinks: 'warn',
  onBrokenAnchors: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-Hant'],
    localeConfigs: {
      en: {label: 'English'},
      'zh-Hant': {label: '繁體中文', htmlLang: 'zh-Hant'},
    },
  },

  markdown: {
    // Treat .md as lenient CommonMark and only .mdx as MDX. The 141 imported
    // chapters contain `<digit` sequences (like `<100ms`, `<50%`) that the MDX
    // JSX parser rejects; CommonMark keeps them as literal text. This also
    // keeps future zh-Hant translations from hitting the same parse errors.
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // Mermaid is rendered by a swizzled CodeBlock (src/theme/CodeBlock) that
  // hands ```mermaid blocks to a React <Mermaid> component, instead of
  // @docusaurus/theme-mermaid (which needs the MDX pipeline, incompatible with
  // markdown.format: 'detect' above). Rendering inside React avoids the
  // hydration/removeChild conflicts that raw DOM manipulation caused.
  themes: [
    [
      // Offline full-text search with Chinese + English tokenization.
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['en', 'zh'],
        indexBlog: false,
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
          showLastUpdateTime: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'AI System Design Guide',
      logo: {
        alt: 'AI System Design Guide',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'guideSidebar',
          position: 'left',
          label: 'Guide',
        },
        {
          href: 'https://github.com/jack51706/ai-system-design-guide',
          label: 'GitHub',
          position: 'right',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Guide',
          items: [
            {label: 'Introduction', to: '/docs/intro'},
            {label: 'Interview Prep', to: '/docs/category/interview-prep'},
            {label: 'Retrieval Systems', to: '/docs/category/retrieval-systems'},
            {label: 'Agentic Systems', to: '/docs/category/agentic-systems'},
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/jack51706/ai-system-design-guide',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} AI System Design Guide. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
