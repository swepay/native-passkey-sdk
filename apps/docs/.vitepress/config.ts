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

    // NOTA: nav/sidebar cobrem hoje só as páginas que existem de fato
    // (index + uma por pacote). Amplie aqui na mesma PR que adicionar
    // o conteúdo correspondente — link para página inexistente não quebra
    // o build (VitePress não valida nav/sidebar), mas quebra a navegação.
    nav: [
      { text: 'Core', link: '/core/' },
      { text: 'React', link: '/react/' },
      { text: 'Angular', link: '/angular/' },
      { text: 'Flutter', link: '/flutter/' },
      {
        text: `v${version}`,
        items: [
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
        text: 'Pacotes',
        items: [
          { text: 'Core — @nativeguard/passkey', link: '/core/' },
          { text: 'React — @nativeguard/passkey-react', link: '/react/' },
          { text: 'Angular — @nativeguard/passkey-angular', link: '/angular/' },
          { text: 'Flutter — native_passkey_flutter', link: '/flutter/' },
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
