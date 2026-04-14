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

    nav: [
      { text: 'Guia', link: '/guide/introduction' },
      { text: 'API Reference', link: '/core/client' },
      {
        text: 'Exemplos',
        items: [
          { text: 'Angular PWA + Flutter', link: '/examples/angular-pwa-flutter' },
          { text: 'Next.js App Router', link: '/examples/nextjs-app-router' },
        ],
      },
      {
        text: `v${version}`,
        items: [
          { text: 'Changelog', link: '/reference/changelog' },
          { text: 'Contribuindo', link: '/guide/contributing' },
          {
            text: 'Pacotes npm',
            items: [
              {
                text: '@nativeguard/passkey',
                link: 'https://www.npmjs.com/package/@nativeguard/passkey',
              },
              {
                text: '@nativeguard/passkey-angular',
                link: 'https://www.npmjs.com/package/@nativeguard/passkey-angular',
              },
              {
                text: '@nativeguard/passkey-react',
                link: 'https://www.npmjs.com/package/@nativeguard/passkey-react',
              },
            ],
          },
        ],
      },
    ],

    sidebar: [
      {
        text: 'Introdução',
        items: [
          { text: 'O que é NativePasskey?', link: '/guide/introduction' },
          { text: 'Instalação', link: '/guide/installation' },
          { text: 'Quick Start', link: '/guide/quick-start' },
          { text: 'Contribuindo', link: '/guide/contributing' },
        ],
      },
      {
        text: 'Core — @nativeguard/passkey',
        collapsed: false,
        items: [
          { text: 'NativePasskeyClient', link: '/core/client' },
          { text: 'Tipos e Interfaces', link: '/core/types' },
          { text: 'Utilitários', link: '/core/utils' },
        ],
      },
      {
        text: 'Angular — @nativeguard/passkey-angular',
        collapsed: false,
        items: [
          { text: 'Setup e Configuração', link: '/angular/setup' },
          { text: 'NativePasskeyService', link: '/angular/service' },
          { text: 'Componentes', link: '/angular/components' },
          { text: 'Guard', link: '/angular/guard' },
          { text: 'Flutter Bridge', link: '/angular/flutter-bridge' },
        ],
      },
      {
        text: 'React — @nativeguard/passkey-react',
        collapsed: false,
        items: [
          { text: 'Setup e Configuração', link: '/react/setup' },
          { text: 'Hooks', link: '/react/hooks' },
          { text: 'Componentes', link: '/react/components' },
          { text: 'Servidor (Next.js)', link: '/react/server' },
        ],
      },
      {
        text: 'NativeGuard',
        collapsed: false,
        items: [{ text: 'Integração OIDC', link: '/nativeguard/integration' }],
      },
      {
        text: 'Tutoriais Completos',
        collapsed: false,
        items: [
          { text: 'Angular PWA + Flutter WebView', link: '/examples/angular-pwa-flutter' },
          { text: 'Next.js 15 App Router', link: '/examples/nextjs-app-router' },
        ],
      },
      {
        text: 'Referência',
        collapsed: true,
        items: [
          { text: 'Códigos de Erro', link: '/reference/errors' },
          { text: 'Suporte a Browsers', link: '/reference/browser-support' },
          { text: 'Changelog', link: '/reference/changelog' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/swepay/native-passkey-sdk' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@nativeguard/passkey' },
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
