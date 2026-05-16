# System Design Collab

A real-time collaborative canvas for software architecture design.

## What It Does

A whiteboard where every component has semantic meaning — not just appearance. Drop typed nodes (PostgreSQL, Redis, Kafka, Load Balancer, etc.), connect them with labeled edges, and collaborate live with your team. The system passively analyzes your architecture and flags issues like bottlenecks, single points of failure, and missing cache layers.

## Why It Exists

Existing tools like Excalidraw and Miro are generic drawing tools — a box is just a box. This tool understands what each node *means* and reasons about your architecture in real time.

## Tech Stack

**Frontend:** React, TypeScript, React Flow, Zustand  
**Backend:** NestJS, TypeScript, Socket.IO  
**Database:** PostgreSQL (TypeORM), Redis  
**Infrastructure:** Docker, Docker Compose

## Features

- Real-time multi-user collaboration with conflict resolution (OT)
- Typed component library (databases, caches, queues, services, etc.)
- Labeled connections (HTTP, gRPC, pub/sub, async queue)
- Architectural warning engine (bottleneck detection, SPOF, missing cache)
- Threaded comments pinned to nodes and edges
- Named canvas snapshots with diff view
- Private rooms with invite link sharing
- JWT authentication

## Running Locally

### Prerequisites
- Node.js v20+
- Docker and Docker Compose

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/system-design-collab.git
cd system-design-collab

# Create environment variables
cp .env.example .env
# Fill in your values in .env

# Start PostgreSQL and Redis
docker compose up -d

# Start the backend
cd server
npm install
npm run start:dev

# Start the frontend (in a new terminal)
cd client
npm install
npm run dev
```

## Project Status

Currently in active development.
