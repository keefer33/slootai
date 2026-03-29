# SlootAI

## ✨ Overview

SlootAI is the web app for [sloot.ai](https://sloot.ai): AI agents, Pipedream-powered integrations, custom tools, MCP servers, file management, video tooling, billing, and Coolify-backed cloud resources.

## 🌐 Website

[https://sloot.ai](https://sloot.ai)

## ⭐ Features

- 🤖 **AI agents** — Multi-model agents (OpenAI, Anthropic, Google Gemini, DeepSeek, and more)
- 🔌 **Pipedream** — Connect thousands of APIs and workflows
- 🛠️ **Custom tools** — Author and run tools tailored to your workflows
- 🖥️ **MCP servers** — Host and connect Model Context Protocol servers
- 📁 **Files** — Upload and organize assets for agents
- 🎥 **Video tools** — Generation, editing, transcription, and analysis flows
- 🔒 **API keys** — Create, mask, and rotate keys safely
- 🎨 **UI** — React Router, Mantine, TypeScript

## 📁 Project structure

```
app/
├── pages/
│   ├── root/           # Home, login, invite, offline, 404
│   ├── account/        # Billing, profile, API keys
│   ├── agents/         # Agents list and agent detail
│   ├── tools/          # Tools catalog and editor
│   ├── files/          # Member files
│   ├── mcpservers/     # MCP server list and edit
│   ├── cloud/          # Coolify-backed cloud (services, databases)
│   └── pipedream/      # Pipedream connect and app flows
├── shared/             # AuthWrapper, AccountLayout, layouts
├── lib/                # Stores, utils, hooks
└── routes.ts
```

## 🔗 Integrations

| Integration | Role |
|-------------|------|
| 🖥️ [Coolify](https://coolify.io/) | Cloud resources and deployments |
| 🔌 [Pipedream](https://pipedream.com/) | Workflow and API integrations |
| ▲ [Vercel AI Gateway](https://vercel.com/ai-gateway) | Optional unified model routing |
| 🗄️ [Supabase](https://supabase.com/) | Database and authentication |
| 💳 [Stripe](https://stripe.com/) | Payments |

## 🧱 Tech stack

- 🧭 **React Router** — Full-stack routing
- ⚛️ **React** — UI
- 🔷 **TypeScript**
- 🎨 **Mantine** — Components
- 🐻 **Zustand** — Client state
- ⚡ **Vite** — Build and dev server
- 🤖 **AI SDKs** — OpenAI, Anthropic, Google GenAI, and related clients

## 📜 Scripts

| Command | Purpose |
|--------|---------|
| `npm run dev` | ⚡ Dev server with HMR |
| `npm run build` | 📦 Production build |
| `npm run start` | 🚀 Serve production build |
| `npm run typecheck` | 🔷 React Router typegen + `tsc` |
| `npm run lint` | 🔍 ESLint |
| `npm run lint:fix` | ✨ ESLint with fixes |
| `npm run format` | 📝 Prettier check |
| `npm run format:fix` | ✨ Prettier write |

---

Built with ❤️ for the AI agent community.
