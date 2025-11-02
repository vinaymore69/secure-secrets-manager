Here is a complete guide README for the Secure Secrets Manager repository.

-----

# Secure Secrets Manager

**Created by Vinay Prakash More**

An end-to-end encrypted secrets management system built with a focus on security, Role-Based Access Control (RBAC), and auditability.

-----

## Architecture

The system is built on a microservice-oriented architecture, separating concerns for scalability and security.

  * **Backend (API):**

      * **Framework:** Node.js + Express
      * **Language:** TypeScript
      * **Database:** PostgreSQL
      * **Cache:** Redis (for sessions/rate-limiting)

  * **Frontend (UI):**

      * **Framework:** React
      * **Language:** TypeScript
      * **Styling:** Tailwind CSS

  * **Crypto Service:**

      * **Framework:** Python + FastAPI
      * **Purpose:** Handles all sensitive cryptographic operations, isolating keys and logic from the main backend.

-----

## Features

  * **End-to-End Encryption:** Secrets are encrypted and decrypted by the dedicated crypto service, never exposed in plaintext to the main API.
  * **Role-Based Access Control (RBAC):** Granular permissions for different user types:
      * **admin:** Full system access, including user management.
      * **user:** Standard user, can manage their own secrets.
      * **auditor:** Read-only access to audit logs.
      * **manager:** Can manage users and view secrets.
  * **Secure Authentication:** JWT-based auth with access and refresh tokens.
  * **Secret Management:** Full CRUD operations (Create, Reveal, Update, Delete) for secrets.
  * **Audit Logging:** Comprehensive logging for all critical events, such as secret access, user creation, and role changes.
  * **Admin Dashboard:** Functionality to manage users and assign roles.

-----

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:

  * [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
  * [Node.js](https://nodejs.org/) (v18+ recommended) & npm
  * [Python](https://www.python.org/) (v3.10+ recommended) & pip

-----

## Local Development Setup

Follow these steps to get the entire application running locally.

### 1\. Clone the Repository

```bash
git clone https://github.com/vinaymore69/secure-secrets-manager.git
cd secure-secrets-manager
```

### 2\. Configure Environment

Copy the example environment file to create your local configuration.

```bash
cp .env.example .env
```

This file contains all the necessary configuration, including database URLs, JWT secrets, and service URLs. Feel free to review and change the default secrets (like `JWT_SECRET`) for your local instance.

### 3\. Start Infrastructure

This command starts the **PostgreSQL** database and **Redis** cache in Docker containers.

```bash
docker-compose up -d
```

The services will be available at:

  * **PostgreSQL:** `postgresql://postgres:postgres@localhost:5432/secrets_db`
  * **Redis:** `redis://localhost:6379`

### 4\. Setup Database

Run the schema file to create all necessary tables, roles, and indexes.

```bash
# Ensure your psql client is installed
psql "postgresql://postgres:postgres@localhost:5432/secrets_db" -f backend/src/db/schema.sql
```

This will set up the `users`, `secrets`, `roles`, `audit_logs`, and other tables.

### 5\. Install Dependencies

Install all required packages for each service.

```bash
# For the Backend
cd backend
npm install
cd ..

# For the Frontend
cd frontend
npm install
cd ..

# For the Crypto Service
cd crypto-service
pip install -r requirements.txt
cd ..
```

### 6\. Run Services

Run each service in a **separate terminal**.

  * **Terminal 1: Backend**

    ```bash
    cd backend
    npm run dev
    # Server listening on http://localhost:3000
    ```

  * **Terminal 2: Crypto Service**

    ```bash
    cd crypto-service
    python -m uvicorn app.main:app --reload
    # Server listening on http://localhost:8000
    ```

  * **Terminal 3: Frontend**

    ```bash
    cd frontend
    npm start
    # App available at http://localhost:3001
    ```

### 7\. Access the Application

You can now access the application in your browser at **[http://localhost:3001](http://localhost:3001)**.

-----

## Creating an Admin User

By default, all new users are created with the standard `user` role. To grant administrative privileges, follow these steps:

1.  **Sign Up:** Go to `http://localhost:3001/signup` and create a new user (e.g., username: `admin`).

2.  **Assign Role:** Run the following script to assign the `admin` role to your new user.

    ```bash
    # Replace 'admin' with the username you just created
    psql "postgresql://postgres:postgres@localhost:5432/secrets_db" \
         -v username="'admin'" \
         -f backend/scripts/create-admin.sql
    ```

    This script will find the user by username, find the 'admin' role, and link them in the `user_roles` table.

3.  **Log In:** Log out and log back in with your `admin` user to access the admin functionalities.

-----

## API Endpoints

The backend provides a comprehensive REST API for all operations.

  * **Authentication:** `POST /api/v1/auth/signup`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`
  * **Secrets:** `POST /api/v1/secrets`, `GET /api/v1/secrets`, `POST /api/v1/secrets/:id/reveal`
  * **Users (Admin):** `GET /api/v1/users`, `POST /api/v1/users/:id/roles`
  * **Audit (Admin/Auditor):** `GET /api/v1/audit`

For a complete list of endpoints, request/response models, and required permissions, please see the [API Endpoints Documentation](./docs/api-endpoints.md).

-----

## Database Schema

The database is designed to securely store user data, encrypted secrets, and audit trails.

  * `users`: Stores user profile information, credentials, and status.
  * `roles`: Defines the available roles in the system (e.g., `admin`, `user`).
  * `user_roles`: A junction table mapping users to their assigned roles.
  * `secrets`: Stores the encrypted secret (`ciphertext`), the encrypted Data Encryption Key (`encrypted_dek`), and other metadata. **Plaintext secrets are never stored.**
  * `audit_logs`: Records all significant actions performed by users for security and compliance.
  * `kms_keys`: Metadata for the Key Management System keys.

For full details, see the schema file: [`backend/src/db/schema.sql`](./backend/src/db/schema.sql).

-----

## License

(License information to be added)