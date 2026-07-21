# Promofy

Landing page da Promofy — curadoria de ofertas e cupons divulgados no WhatsApp.

Site: [apromofy.online](https://apromofy.online)

## Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [React Router](https://reactrouter.com/)

## Desenvolvimento

```bash
npm install
npm run dev      # http://localhost:8080
```

## Build

```bash
npm run build    # gera a pasta dist/
npm run preview  # serve o build localmente
```

## Deploy

O deploy é automático via **GitHub Pages**. Todo push na branch `main` dispara
o workflow em [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
que compila o projeto e publica a pasta `dist/`.

O domínio personalizado está em [`public/CNAME`](public/CNAME). Como o app usa
rotas client-side (React Router), o workflow copia `index.html` para `404.html`
para que links diretos como `/termos`, `/privacidade` e `/contato` funcionem no
GitHub Pages.
