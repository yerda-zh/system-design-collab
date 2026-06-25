# System Design Collab

A real-time collaborative canvas for software architecture design. Multiple engineers can simultaneously design, annotate, and discuss system architectures on a shared whiteboard that understands what each component means.

## Live Demo
[Add URL after deployment]

## Features
- Real-time multi-user collaboration with operational transform conflict resolution
- Typed component library: databases, caches, queues, services, load balancers, API gateways, CDNs
- Typed connections: HTTP/REST, gRPC, Async/Queue, Pub/Sub with directional arrows
- Architectural warning engine: detects single points of failure, missing cache layers, cascading failure risks, missing load balancers, and direct client-to-database connections
- Threaded comments pinned to nodes and edges
- Named canvas snapshots with one-click restore
- Private rooms with shareable invite links
- JWT authentication with automatic session handling
- Live cursors showing collaborator positions in canvas space

## Tech Stack
Frontend: React 18, TypeScript, React Flow, Zustand, Socket.IO Client, Vite  
Backend: NestJS, TypeScript, Socket.IO, TypeORM, PostgreSQL, Redis  
Infrastructure: Docker, Docker Compose

## Architecture Highlights
- WebSocket-based real-time sync using Socket.IO rooms
- Operational Transform (OT) for conflict resolution — server is authority, clients rebase on revision mismatch
- Redis as live state store for active rooms, PostgreSQL for durable persistence
- 500ms debounced graph analysis engine running server-side after each canvas operation
- JWT validation on both HTTP and WebSocket layers

## Running Locally

Prerequisites: Node.js v20+, Docker and Docker Compose

```bash
git clone https://github.com/yourusername/system-design-collab.git
cd system-design-collab
cp .env.example .env
# Fill in your values in .env
docker compose up -d
cd server && npm install && npm run start:dev
cd client && npm install && npm run dev
```

Open http://localhost:5173
