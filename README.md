# System Design Collab

A real-time collaborative canvas for software architecture design. Drop typed components (databases, caches, queues, services, load balancers, CDNs and more), connect them with labeled edges (HTTP, gRPC, async, pub/sub), and design systems together with live cursors and instant sync. A server-side graph analysis engine passively detects architectural anti-patterns — single points of failure, missing cache layers, cascading failure risks, and more — flagging them as warnings directly on the canvas as you design.

## Live Demo

**[system-design-collab.vercel.app](https://system-design-collab.vercel.app)**

Example diagrams available inside: URL Shortener, Twitter Feed, Notification System.

## What Makes It Different

Existing tools like Excalidraw and Miro are generic drawing tools — a box is just a box. System Design Collab understands what each node *means* and reasons about your architecture in real time. Drop a PostgreSQL node and the engine knows it can be a bottleneck. Connect 3+ services directly to it with no cache — a warning fires immediately.

## Features

- **Real-time collaboration** — Live cursors, instant sync, and conflict resolution via Operational Transform (OT). Multiple users edit simultaneously with server-side revision tracking ensuring everyone converges to the same state.
- **25 typed node types** — Clients, DNS, CDN, Firewall, Load Balancer, API Gateway, Reverse Proxy, Database, Cache, Object Storage, Block Storage, Data Warehouse, Search Engine, Time Series DB, Service, Worker, Serverless, Container Orchestrator, Message Queue, Event Bus, Stream Processor, Monitoring, Logging, Identity Provider, Secret Manager.
- **10 typed edge types** — HTTP/REST, gRPC, WebSocket, TCP, DB Protocol, Async/Queue, Pub/Sub, Event Stream, Internal, Webhook — each with distinct visual styling and directional arrows.
- **18 architectural warning rules** — Single point of failure, missing cache layer, cascading failure risk, no load balancer, direct client-to-database, no API gateway, no firewall, no CDN, no dead letter queue, single queue consumer, synchronous write on critical path, unbounded fan-out, no object storage, no cache for search, no rate limiting, no read replica, no monitoring, no logging.
- **Threaded comments** — Comments pinned to specific nodes and edges with real-time sync across all users.
- **Named snapshots** — Save point-in-time copies of the canvas with one-click restore. Syncs across all active users instantly.
- **Icon rail sidebar** — VS Code-inspired icon rail switches between the component library and warnings panel. Warning badge shows count with severity color.
- **Inline node editing** — Double-click any node to edit its label. Syncs in real time across all users.
- **Private rooms with invite links** — Canvases are private by default. Share via invite link, regenerate to revoke access for new joiners.
- **JWT authentication** — Secure registration and login with automatic session handling and token expiry redirect.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, React Flow, Zustand, Framer Motion, Socket.IO Client |
| Backend | NestJS, TypeScript, Socket.IO, TypeORM, class-validator, Helmet |
| Database | PostgreSQL (persistent storage), Redis (live room state) |
| Auth | JWT, Passport, bcrypt |
| Testing | Jest, 33 unit tests for the warning engine |
| Infrastructure | Docker, Docker Compose, Railway, Vercel |

## Architecture Highlights

**Real-time sync with OT conflict resolution**

Every canvas change is expressed as a typed operation (`addNode`, `moveNode`, `addEdge`, `replaceCanvas`, etc.). The server is the authority — each operation carries a `clientRevision`. If a client is behind, the server rebases the operation before applying. Redis holds the live state of active rooms; PostgreSQL is the durable store. A background flush writes from Redis to PostgreSQL every 5 seconds, with an immediate flush when the last user leaves a room.

**Server-side graph analysis warning engine**

After every canvas operation (500ms debounce), the server runs a graph analysis pass over the current canvas state in Redis. Each of the 18 rules is a pure function taking canvas state and returning warnings. Infrastructure nodes (DNS, CDN, Load Balancer, API Gateway, Firewall) are excluded from rules that only apply to application services. Unconnected nodes do not satisfy rules that require connectivity. Results are pushed to all room clients via WebSocket. The engine has 33 automated unit tests covering true positives, true negatives, and edge cases discovered during manual testing.

**Two-layer storage**

Active rooms live in Redis (fast, in-memory). When all users leave, the room is flushed to PostgreSQL. When a user joins a cold room, it is loaded from PostgreSQL into Redis. This pattern handles high-frequency canvas updates without hitting the database on every keystroke during an active session.

**WebSocket security**

JWT validation on every connection handshake. Room membership verified before joining any Socket.IO room. `userId` always read from the verified JWT payload — never trusted from the client payload. Cursor events rate-limited server-side at 16ms intervals.

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

### Running Tests

```bash
cd server
npx jest
```

## Project Structure

```
system-design-collab/
├── client/                    # React frontend
│   └── src/
│       ├── components/
│       │   ├── canvas/        # React Flow canvas, nodes, edges
│       │   ├── sidebar/       # Icon rail, component library, warning panel
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
        ├── warnings/          # Graph analysis warning engine + tests
        ├── snapshots/         # Named canvas versions
        ├── comments/          # Threaded annotations
        ├── health/            # Health check endpoint
        └── redis/             # Redis service (live state)
```

## Key Technical Decisions

**OT over CRDT (Yjs)**

Implemented a simplified Operational Transform system rather than using Yjs. Canvas operations are simpler than text editing — the operation set is bounded and conflict rules are deterministic (last-write-wins for moves, no-op for deletes of missing nodes). This makes the conflict resolution logic fully explainable in interviews, with Yjs as the documented production upgrade path.

**Redis as live state, PostgreSQL as durable storage**

Separating live state from durable storage avoids hitting PostgreSQL on every canvas operation during an active session. The debounced flush pattern (5s interval + immediate flush on room empty) balances durability with performance.

**Server-side warning analysis**

Running the warning engine on the server ensures all users see identical warnings regardless of local state. It also keeps the analysis logic out of the client bundle, makes it independently testable, and allows future extension without client updates.

**Infrastructure nodes excluded from application rules**

DNS, CDN, Load Balancer, API Gateway, Firewall, and Reverse Proxy nodes are excluded from SPOF, cascading failure, and no load balancer checks. These are managed infrastructure components — applying application-level reliability rules to them produces false positives and confuses the architectural signal.

**Connected-node requirement for rule satisfaction**

An unconnected node sitting on the canvas does not satisfy rules that require its presence. A CDN node with no edges does not clear the "No CDN for Clients" warning. A replica database with no edges does not clear the SPOF warning. This ensures warnings reflect actual architecture, not canvas decoration.

