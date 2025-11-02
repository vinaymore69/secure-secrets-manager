# API Endpoints Documentation

## Authentication

### POST /api/v1/auth/signup
Create a new user account.

**Request:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:** 201 Created
```json
{
  "message": "User created successfully",
  "userId": "uuid"
}
```

### POST /api/v1/auth/login
Authenticate and receive tokens.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:** 200 OK
```json
{
  "message": "Login successful",
  "user": { ... },
  "tokens": {
    "accessToken": "jwt",
    "refreshToken": "jwt"
  }
}
```

### POST /api/v1/auth/refresh
Refresh access token.

### POST /api/v1/auth/logout
Logout and invalidate tokens.

### GET /api/v1/auth/me
Get current user info.

---

## Secrets

### POST /api/v1/secrets
Create an encrypted secret.

**Requires:** Authentication

**Request:**
```json
{
  "name": "string",
  "plaintext": "string"
}
```

**Response:** 201 Created
```json
{
  "message": "Secret created successfully",
  "secretId": "uuid"
}
```

### GET /api/v1/secrets
List all secrets (metadata only).

**Requires:** Authentication

**Query Parameters:**
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:** 200 OK
```json
{
  "secrets": [
    {
      "id": "uuid",
      "name": "string",
      "owner_id": "uuid",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "metadata": {}
    }
  ],
  "pagination": { ... }
}
```

### GET /api/v1/secrets/:id
Get secret metadata (no plaintext).

**Requires:** Authentication, Ownership or Admin role

### POST /api/v1/secrets/:id/reveal
Decrypt and reveal secret plaintext.

**Requires:** Authentication, Ownership or Admin role

**Response:** 200 OK
```json
{
  "plaintext": "string",
  "metadata": {}
}
```

### PUT /api/v1/secrets/:id
Update secret name or re-encrypt with new plaintext.

**Requires:** Authentication, Ownership

### DELETE /api/v1/secrets/:id
Soft delete a secret.

**Requires:** Authentication, Ownership

### GET /api/v1/secrets/search?q=query
Search secrets by name.

**Requires:** Authentication

---

## Users (Admin Only)

### GET /api/v1/users
List all users.

**Requires:** Admin role

### GET /api/v1/users/:id
Get user details.

**Requires:** Admin role

### POST /api/v1/users/:id/roles
Assign role to user.

**Requires:** Admin role

**Request:**
```json
{
  "role": "admin|user|auditor|manager"
}
```

### DELETE /api/v1/users/:id/roles/:roleId
Remove role from user.

**Requires:** Admin role

### DELETE /api/v1/users/:id
Delete user.

**Requires:** Admin role

---

## Audit (Admin/Auditor Only)

### GET /api/v1/audit
List audit logs.

**Requires:** Admin or Auditor role

**Query Parameters:**
- `limit` (optional)
- `offset` (optional)
- `event_type` (optional): Filter by event type
- `user_id` (optional): Filter by user
- `resource_type` (optional): Filter by resource type

**Response:** 200 OK
```json
{
  "logs": [
    {
      "id": "bigint",
      "event_type": "string",
      "user_id": "uuid",
      "resource_type": "string",
      "resource_id": "uuid",
      "ip_address": "string",
      "user_agent": "string",
      "details": {},
      "created_at": "timestamp"
    }
  ],
  "pagination": { ... }
}
```