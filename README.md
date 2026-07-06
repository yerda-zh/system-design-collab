# System Design Collab

A real-time collaborative canvas for software architecture design. Multiple engineers can simultaneously design, annotate, and discuss system architectures on a shared whiteboard that understands what each component means.

## Live Demo

**[system-design-collab.vercel.app](https://system-design-collab.vercel.app)**

## What It Does

Existing tools like Excalidraw and Miro are generic drawing tools — a box is just a box. System Design Collab understands what each node *means* and reasons about your architecture in real time.

Drop typed components (PostgreSQL, Redis, Kafka, Load Balancer, API Gateway, CDN), connect them with labeled edges (HTTP/REST, gRPC, Async, Pub/Sub), and collaborate live with your team. The warning engine passively analyzes your canvas and flags architectural issues as you design.

## Features

- **Real-time collaboration** — Live cursors, instant sync, and conflict resolution via Operational Transform (OT). Multiple users edit simultaneously with server-side revision tracking.
- **Typed component library** — 7 node types (Database, Cache, Queue, Service, Load Balancer, API Gateway, CDN), each carrying semantic meaning used by the warning engine.
- **Typed connections** — HTTP/REST, gRPC, Async/Queue, Pub/Sub edges with directional arrows and visual distinction.
- **Architectural warning engine** — Detects single points of failure, missing cache layers, cascading failure risks, missing load balancers, and direct client-to-database connections. Runs server-side with 500ms debounce after each canvas change.
- **Threaded comments** — Comments pinned to specific nodes and edges with real-time sync. Replies, badges, and delete.
- **Named snapshots** — Save point-in-time copies of the canvas with one-click restore. Syncs across all active users instantly.
- **Private rooms with invite links** — Canvases are private by default. Share via invite link, regenerate to revoke access.
- **JWT authentication** — Secure registration and login with automatic session handling and token expiry redirect.
- **Node label editing** — Double-click any node to edit its label inline. Syncs in real time across all users.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, React Flow, Zustand, Framer Motion |
| Backend | NestJS, TypeScript, Socket.IO, TypeORM, class-validator |
| Database | PostgreSQL (persistent storage), Redis (live room state) |
| Auth | JWT, Passport, bcrypt |
| Infrastructure | Docker, Docker Compose, Railway, Vercel |

## Architecture Highlights

**Real-time sync with OT conflict resolution**
Every canvas change is expressed as a typed operation (`addNode`, `moveNode`, `addEdge`, etc.). The server is the authority — each operation carries a `clientRevision`. If a client is behind, the server rebases the operation before applying. Redis holds the live state of active rooms; PostgreSQL is the durable store. A background flush writes from Redis to PostgreSQL every 5 seconds.

**Graph-based warning engine**
After every canvas operation (500ms debounce), the server runs a graph analysis pass over the current canvas state. Rules detect structural anti-patterns — SPOF is detected by checking synchronous in-degree against replica count; cascading failure by DFS traversal following synchronous edges; missing cache by checking intermediate nodes between services and databases. Results are pushed to all room clients via WebSocket.

**Two-layer storage**
Active rooms live in Redis (fast, in-memory). When all users leave, the room is flushed to PostgreSQL. When a user joins a cold room, it's loaded from PostgreSQL into Redis. This pattern handles high-frequency canvas updates without hitting the database on every keystroke.

**WebSocket security**
JWT validation on every connection handshake. Room membership verified before joining any Socket.IO room. `userId` always read from the verified JWT payload — never trusted from client payload.

## Running Locally

### Prerequisites
- Node.js v20+
- Docker and Docker Compose

### Setup

```bash
# Clone the repository
git clone https://github.com/yerda-zh/system-design-collab.git
cd system-design-collab

# Create environment files
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
# Fill in your values in server/.env and client/.env

# Start PostgreSQL and Redis
docker compose up -d

# Start the backend
cd server
npm install
npm run start:dev

# Start the frontend (new terminal)
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Environment Variables

**server/.env**
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=sdc_user
DB_PASSWORD=sdc_password
DB_NAME=sdc_db
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=15m
CORS_ORIGIN=http://localhost:5173
```

**client/.env**
```env
VITE_API_URL=http://localhost:3001
```

## Project Structure

```
system-design-collab/
├── client/                    # React frontend
│   └── src/
│       ├── components/
│       │   ├── canvas/        # React Flow canvas, nodes, edges
│       │   ├── sidebar/       # Component library, warning panel
│       │   ├── room/          # Share popup, snapshots, comments
│       │   └── collaboration/ # Active users, cursors
│       ├── hooks/             # useCollaboration (WebSocket logic)
│       ├── store/             # Zustand stores (canvas, warnings, comments)
│       ├── pages/             # Landing, Dashboard, Room, Login, etc.
│       └── api/               # Axios HTTP clients
└── server/                    # NestJS backend
    └── src/
        ├── auth/              # JWT, Passport, bcrypt
        ├── rooms/             # Room management, invite tokens
        ├── canvas/            # WebSocket gateway, OT, Redis sync
        ├── warnings/          # Graph analysis warning engine
        ├── snapshots/         # Named canvas versions
        ├── comments/          # Threaded annotations
        └── redis/             # Redis service (live state)
```

## Key Technical Decisions

**OT over CRDT (Yjs)**
Implemented a simplified Operational Transform system rather than using Yjs. Canvas operations are simpler than text editing — the operation set is bounded and conflict rules are deterministic (last-write-wins for moves, no-op for deletes of missing nodes). This makes the conflict resolution logic fully explainable in interviews, with Yjs as the documented production upgrade path.

**Redis as live state, PostgreSQL as durable storage**
Separating live state from durable storage avoids hitting PostgreSQL on every canvas operation during an active session. The debounced flush pattern (5s interval + immediate flush on room empty) balances durability with performance.

**Server-side warning analysis**
Running the warning engine on the server ensures all users see identical warnings regardless of local state. It also keeps the analysis logic out of the client bundle and makes it independently testable and extensible.

## License

MIT