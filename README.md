# Secure Secrets Manager

End-to-end encrypted secrets management system with RBAC.

## Quick Start

1. Copy `.env.example` to `.env`
2. Run `docker-compose up -d` to start PostgreSQL
3. Run database migrations
4. Start backend: `cd backend && npm run dev`
5. Start crypto service: `cd crypto-service && python -m uvicorn app.main:app --reload`
6. Start frontend: `cd frontend && npm start`

## Architecture

- Backend: Node.js + Express + TypeScript
- Frontend: React + TypeScript
- Crypto Service: Python + FastAPI
- Database: PostgreSQL