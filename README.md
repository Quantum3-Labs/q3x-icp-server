# ICP Canister Backend

## 1. Project Overview

**NestJS backend for ICP multisig wallet canister deployment**

A robust backend service built with NestJS that provides a REST API for deploying and managing multisig wallet canisters on the Internet Computer Protocol (ICP). This service acts as a bridge between client applications and the ICP network, handling canister deployment, tracking deployment status, and managing wallet configurations.

### Key Features

- **Deploy Canisters**: Automated deployment of multisig wallet canisters to ICP
- **Track Deployments**: Real-time monitoring and status tracking of canister deployments
- **REST API**: RESTful endpoints for wallet management and canister operations
- **Database Integration**: PostgreSQL with Prisma ORM for persistent data storage
- **Identity Management**: Secure identity handling for ICP interactions

### Architecture

```
Client Application → REST API → Backend Service → ICP Network
                                      ↓
                               PostgreSQL Database
```

The system consists of:

- **Backend Deployment Service**: NestJS application handling API requests
- **Database Tracking**: PostgreSQL database storing deployment records and wallet data
- **ICP Integration**: Direct communication with Internet Computer canisters

## 2. Prerequisites & Requirements

### System Requirements

- **Node.js**: Version 18.x or higher
- **Yarn**: Package manager (latest stable version)
- **Docker**: Latest stable version
- **Docker Compose V2**: Latest stable version (built into Docker)
- **DFX**: Internet Computer SDK (latest version)

### Required Tools

```bash
# Install DFX (Internet Computer SDK)
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Verify installations
node --version           # Should be 18+
yarn --version          # Latest stable
docker --version        # Latest stable
docker compose version # Latest stable
dfx --version           # Latest
```

## Quick Start

### 1. Setup

```bash
# Clone and install
git clone https://github.com/Quantum3-Labs/q3x-icp-server.git
cd q3x-icp-server
yarn install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env
```

### 3. Database

```bash
# Start PostgreSQL
docker compose up -d postgres

# Verify database is running
docker compose ps

# Check database logs (optional)
docker compose logs postgres
```

#### Prisma Configuration

```bash
# Generate Prisma client
yarn db:generate

# Run database migrations
yarn db:migrate

# Optional: Seed database with initial data
yarn db:seed
```

### 4. Generate Backend Identity

```bash
# Generate identity for ICP interactions
yarn generate:identity

# This creates a new identity and outputs the private key
# Copy the private key to your .env file as BACKEND_PRIVATE_KEY
```

### 5. Asset Preparation

Ensure required WASM files are in place:

```bash
# Verify wallet.wasm exists
ls -la assets/wallet.wasm

# If missing, copy your compiled wallet canister WASM file:
# cp path/to/your/wallet.wasm assets/wallet.wasm
```

### 6. Start ICP Replica

```bash
# Start local ICP replica (separate terminal)
dfx start --clean --background



### 7. Run Application

```bash
# View migration status (optional)
npx prisma migrate status

# Access database GUI (optional)
yarn db:studio

# Development mode
yarn start:dev

# Server runs on http://localhost:4000
```

## Configuration

### Environment Variables

```bash
# ICP Network
ICP_REPLICA_URL=http://localhost:4943  # Local development
ICP_REPLICA_URL=https://ic0.app        # Production

# Database (matches docker-compose.yml)
DATABASE_URL="postgresql://icp_user:icp_password@localhost:5433/icp_canister_db"

# Identity
BACKEND_PRIVATE_KEY=your_generated_private_key
NODE_ENV=development
```

## API Endpoints

```bash
# Health check
curl http://localhost:4000/api/health

# Create wallet
curl -X POST http://localhost:4000/api/wallets \
  -H "Content-Type: application/json" \
  -d '{"name": "Team Treasury", "metadata": {"description": "Main treasury"}}'

# Get wallet status
curl http://localhost:4000/api/wallets/{wallet-id}

# List wallets
curl http://localhost:4000/api/wallets

# Get canister status
curl http://localhost:4000/api/wallets/{wallet-id}/canister-status
```

## Development Commands

```bash
# Application
yarn start:dev      # Development with hot reload
yarn build          # Production build
yarn lint           # Linting
yarn format         # Code formatting

# Database
yarn db:generate    # Generate Prisma client
yarn db:migrate     # Run migrations
yarn db:studio      # Open Prisma Studio GUI
yarn db:seed        # Seed database

# Docker Compose operations
docker compose up -d postgres          # Start database only
docker compose up -d                   # Start all services
docker compose down                    # Stop all services
docker compose logs postgres           # View database logs
docker compose exec postgres psql -U icp_user -d icp_canister_db  # Access PostgreSQL CLI
```

## 6. Architecture & File Structure

### Project Structure

```
q3x-icp-server/
├── src/
│   ├── app.module.ts           # Main application module
│   ├── main.ts                 # Application entry point
│   ├── common/                 # Shared utilities and models
│   │   ├── constants/          # Application constants
│   │   ├── dto/                # Data Transfer Objects
│   │   └── models/             # Domain models
│   ├── config/                 # Configuration modules
│   │   ├── app.config.ts       # App-level configuration
│   │   ├── database.config.ts  # Database configuration
│   │   └── icp.config.ts       # ICP network configuration
│   ├── database/               # Database module and services
│   │   ├── database.module.ts  # Database module
│   │   └── prisma.service.ts   # Prisma service wrapper
│   ├── health/                 # Health check endpoints
│   ├── icp/                    # ICP integration services
│   │   ├── services/           # ICP-related services
│   │   └── types/              # ICP type definitions
│   └── wallet/                 # Wallet management module
│       ├── wallet.controller.ts # REST API endpoints
│       ├── wallet.service.ts   # Business logic
│       └── dto/                # Wallet-specific DTOs
├── prisma/                     # Database schema and migrations
├── assets/                     # WASM files and static assets
└── scripts/                    # Utility scripts
```

### Service Responsibilities

#### WalletService

- Canister deployment and management
- Wallet lifecycle operations
- Database persistence
- Status tracking and updates

#### CanisterManagerService  

- Direct ICP canister interactions
- Canister creation and installation
- Cycle management
- Status monitoring

#### ICPAgentService

- ICP network communication
- Identity management
- Request/response handling
- Error handling and retries

#### PrismaService

- Database connection management
- Query execution
- Transaction handling

### Data Flow

```
1. Client Request → WalletController
2. Controller → WalletService (business logic)
3. WalletService → CanisterManagerService (ICP operations)
4. CanisterManagerService → ICP Network
5. Response: ICP Network → Service → Controller → Client
6. Persistence: WalletService → PrismaService → PostgreSQL
```
