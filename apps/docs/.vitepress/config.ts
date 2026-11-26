import { defineConfig } from 'vitepress';

// Lê a versão do package.json raiz para exibir na sidebar
const version = process.env.npm_package_version ?? '0.0.0';

export default defineConfig({
  lang: 'pt-BR',
  title: 'NativePasskey SDK',
  description:
    'Autenticação WebAuthn/FIDO2 (Passkey) para Angular, React e Flutter — ecossistema Swepay/NativeGuard.',

  // Base URL para GitHub Pages: https://<org>.github.io/native-passkey-sdk/
  base: '/native-passkey-sdk/',

  // Geração de sitemap para SEO
  sitemap: {
    hostname: 'https://swepay.github.io/native-passkey-sdk/',
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/native-passkey-sdk/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#0070f3' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'NativePasskey SDK' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: `NativePasskey <span style="font-size:0.7em;color:var(--vp-c-brand-1)">v${version}</span>`,

    // NOTA: nav/sidebar cobrem apenas páginas que existem de fato em apps/docs.
    // Ao adicionar uma página, inclua-a aqui na mesma PR (VitePress não valida
    // links de nav/sidebar no build).
    nav: [
      { text: 'Guia', link: '/guide/introduction', activeMatch: '/guide/' },
      {
        text: 'Pacotes',
        items: [
          { text: 'Core', link: '/core/' },
          { text: 'React', link: '/react/' },
          { text: 'Angular', link: '/angular/' },
          { text: 'Flutter', link: '/flutter/' },
        ],
      },
      { text: 'Tutoriais', link: '/examples/nextjs-app-router', activeMatch: '/examples/' },
      { text: 'Erros', link: '/reference/errors' },
      {
        text: `v${version}`,
        items: [
          {
            text: 'Pacotes npm',
            items: [
              {
                text: '@swepay/native-passly-sdk',
                link: 'https://www.npmjs.com/package/@swepay/native-passly-sdk',
              },
              {
                text: '@swepay/native-passly-angular',
                link: 'https://www.npmjs.com/package/@swepay/native-passly-angular',
              },
              {
                text: '@swepay/native-passly-react',
                link: 'https://www.npmjs.com/package/@swepay/native-passly-react',
              },
              {
                text: 'native_passkey_flutter',
                link: 'https://pub.dev/packages/native_passkey_flutter',
              },
            ],
          },
        ],
      },
    ],

    sidebar: [
      {
        text: 'Guia',
        items: [
          { text: 'Introdução', link: '/guide/introduction' },
          { text: 'Instalação', link: '/guide/installation' },
          { text: 'Quick start', link: '/guide/quick-start' },
        ],
      },
      {
        text: 'Core — @swepay/native-passly-sdk',
        collapsed: false,
        items: [
          { text: 'Visão geral', link: '/core/' },
          { text: 'NativePasskeyClient', link: '/core/client' },
          { text: 'Tipos', link: '/core/types' },
        ],
      },
      {
        text: 'React — @swepay/native-passly-react',
        collapsed: false,
        items: [
          { text: 'Visão geral', link: '/react/' },
          { text: 'PasskeyProvider', link: '/react/setup' },
          { text: 'Hooks', link: '/react/hooks' },
          { text: 'Componentes', link: '/react/components' },
          { text: 'PasskeyVerifier (servidor)', link: '/react/server' },
        ],
      },
      {
        text: 'Angular — @swepay/native-passly-angular',
        collapsed: false,
        items: [
          { text: 'Visão geral', link: '/angular/' },
          { text: 'Setup', link: '/angular/setup' },
          { text: 'NativePasskeyService', link: '/angular/service' },
          { text: 'Componentes', link: '/angular/components' },
          { text: 'Guard de rota', link: '/angular/guard' },
          { text: 'Ponte Flutter', link: '/angular/flutter-bridge' },
        ],
      },
      {
        text: 'Flutter — native_passkey_flutter',
        collapsed: false,
        items: [
          { text: 'Visão geral', link: '/flutter/' },
          { text: 'Setup Android/iOS', link: '/flutter/setup' },
          { text: 'API Dart', link: '/flutter/api' },
          { text: 'Fallback WebView', link: '/flutter/webview-fallback' },
        ],
      },
      {
        text: 'Tutoriais',
        items: [
          { text: 'Next.js App Router', link: '/examples/nextjs-app-router' },
          { text: 'Angular PWA + Flutter WebView', link: '/examples/angular-pwa-flutter' },
        ],
      },
      {
        text: 'Referência',
        items: [{ text: 'Erros (PasskeyErrorCode)', link: '/reference/errors' }],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/swepay/native-passkey-sdk' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@swepay/native-passly-sdk' },
    ],

    footer: {
      message: 'Publicado sob a licença MIT.',
      copyright: `Copyright © 2024–${new Date().getFullYear()} Swepay / NativeGuard`,
    },

    editLink: {
      pattern: 'https://github.com/swepay/native-passkey-sdk/edit/main/apps/docs/:path',
      text: 'Editar esta página no GitHub',
    },

    lastUpdated: {
      text: 'Última atualização',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium',
      },
    },

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: 'Pesquisar', buttonAriaLabel: 'Pesquisar documentação' },
              modal: {
                noResultsText: 'Nenhum resultado para',
                resetButtonTitle: 'Limpar pesquisa',
                footer: {
                  selectText: 'selecionar',
                  navigateText: 'navegar',
                  closeText: 'fechar',
                },
              },
            },
          },
        },
      },
    },
  },

  markdown: {
    theme: { light: 'github-light', dark: 'github-dark' },
    lineNumbers: true,
  },
});
