# CodeForge IDE 🔥

> A production-grade, browser-based IDE built with the MERN stack. Code, preview, and collaborate — all from your browser, zero local setup required.

![CodeForge](https://img.shields.io/badge/Stack-MERN-blue?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Socket.io](https://img.shields.io/badge/Socket.io-4.x-white?style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-7-green?style=flat-square&logo=mongodb)

---

## 🗂 Folder Structure

```
codeforge/
├── frontend/                    # React + Vite + Tailwind
│   └── src/
│       ├── components/
│       │   ├── editor/          # Monaco editor, tab bar, IDE workspace
│       │   ├── sidebar/         # File tree explorer
│       │   ├── terminal/        # Terminal panel
│       │   ├── preview/         # Live preview iframe
│       │   ├── ui/              # Command palette, toasts
│       │   └── layout/          # Activity bar, status bar
│       ├── hooks/               # useAutoSave, useSocket, useKeyboardShortcuts
│       ├── lib/                 # api.js, socket.js, utils.js
│       ├── pages/               # AuthPage, Dashboard
│       ├── store/               # Zustand stores (auth, project, editor, UI)
│       └── styles/              # globals.css (design tokens, scrollbars)
│
├── backend/                     # Express + Socket.io + MongoDB
│   ├── models/                  # User.js, Project.js (Mongoose schemas)
│   ├── routes/                  # auth.js, projects.js, files.js, packages.js
│   ├── middleware/              # auth.js (JWT protect)
│   ├── socket/                  # handlers.js (Socket.io rooms)
│   ├── server.js                # Entry point
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & install

```bash
git clone https://github.com/yourname/codeforge.git
cd codeforge

# Backend
cd backend
cp .env.example .env      # Edit JWT_SECRET and MONGODB_URI
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Run in development

```bash
# Terminal 1 – backend
cd backend && npm run dev

# Terminal 2 – frontend
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 3. Run with Docker

```bash
docker-compose up --build
```

---

## 🏗 Architecture

### Frontend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React 18 + Vite | Fast HMR dev server, optimized builds |
| Styling | Tailwind CSS | Utility-first design tokens |
| Animations | Framer Motion | Page transitions, panel reveals, micro-interactions |
| Editor | Monaco Editor | VS Code engine in the browser |
| State | Zustand | Lightweight, selector-based stores |
| Real-time | Socket.io client | Live file sync between sessions |
| Layout | react-resizable-panels | Draggable IDE panel system |

### Backend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Server | Express.js | REST API with middleware pipeline |
| Database | MongoDB + Mongoose | Document storage for projects, files, state |
| Real-time | Socket.io | Project rooms, live code broadcast |
| Auth | JWT + bcryptjs | Stateless authentication |

### Data Model

```
User
  └── Projects (one-to-many)
        ├── files[]          Flat array of FileNode (id, name, type, content, path, parentId)
        ├── packages[]       Installed npm packages
        ├── editorState      openTabs[], activeTabId, cursorPositions
        └── terminalHistory  Command/output log
```

Files are stored as a **flat array** with `parentId` references (not nested), so any single file can be updated via `findOne` + `files.find()` without deep traversal. The tree is reconstructed client-side by `buildFileTree()`.

### Session Persistence

Editor state (open tabs, active file, cursor positions) is persisted to MongoDB:
- On tab open/close → `PATCH /api/files/:projectId/state/editor`
- On content change → debounced `PATCH /api/files/:projectId/:fileId` (1.5s after last keystroke)
- On project load → `editorState` is rehydrated into Zustand store

### Live Preview

The iframe-based preview works by:
1. Collecting all project files from Zustand store (in-memory, latest keystrokes)
2. Finding `index.html` and inlining CSS/JS file references
3. Creating a `Blob` URL and setting it as `iframe.src`
4. Auto-refreshing 800ms after any file content change
5. Using `sandbox="allow-scripts allow-same-origin"` for safe isolation

### Socket Architecture

```
Client joins → socket.emit('join:project', { projectId })
             → server: socket.join(`project:${projectId}`)

Code change  → socket.emit('code:change', { fileId, content })
             → server: socket.to(room).emit('code:change', ...)
             → other clients update their in-memory content
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ + P` | Open Command Palette |
| `Ctrl/⌘ + B` | Toggle Sidebar |
| `Ctrl/⌘ + \`` | Toggle Terminal |
| `Ctrl/⌘ + W` | Close active tab |
| `Ctrl/⌘ + S` | Force save file |
| `Ctrl/⌘ + Shift+P` | Toggle Preview |

---

## 🤖 AI Usage Strategy

This project was built with AI assistance (Claude/Cursor) as a force multiplier:

**Where AI accelerated delivery:**
- Boilerplate: Mongoose schemas, Express route scaffolding, JWT middleware
- Tailwind class combinations for the glassmorphism design system
- Monaco editor theme token configuration
- Debounce/auto-save logic patterns

**Where human reasoning was required:**
- Architecture decision: flat file array vs nested document (chose flat for O(1) MongoDB updates)
- Session persistence strategy: which state to persist vs keep ephemeral
- Preview sandboxing: `Blob` URL approach vs WebContainers (chose Blob for zero-dependency preview)
- Socket room scoping to prevent cross-project leakage
- Zustand store decomposition (4 stores: auth, project, editor, UI) to minimize re-renders

**Prompting strategy used:**
- Break into vertical slices: "build the auth routes with JWT" → verify → "now the file CRUD routes"
- Always specify constraints: "return flat file array, not nested"
- Review every generated chunk before proceeding to avoid compounding errors

---

## ⚠️ Known Limitations & Tradeoffs

| Limitation | Reason | Future fix |
|-----------|--------|-----------|
| No real `npm install` in browser | Requires Node.js runtime | Integrate WebContainers API |
| Preview limited to vanilla HTML/CSS/JS | Iframe can't run JSX/TS | Add Babel/esbuild WASM transform |
| Single user per project (no multi-cursor) | Scope limitation | Add Yjs CRDT for collaborative editing |
| Terminal is simulated | No server-side shell | Add Docker exec or WebContainers shell |
| No file upload/download | Out of scope | Add zip export via JSZip |

---

## 🌐 Deployment

### Render / Railway

1. Deploy MongoDB on Atlas
2. Deploy backend: set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`
3. Deploy frontend: set `VITE_API_URL` if not proxied

### Vercel (frontend) + Render (backend)

```bash
# Frontend .env
VITE_API_URL=https://your-backend.render.com
```

Update `vite.config.js` proxy target to match your backend URL for production.

---

## 📄 License

MIT © CodeForge
