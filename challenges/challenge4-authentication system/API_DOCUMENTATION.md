# API Documentation

## Base URL
```
Development: http://localhost:3001
Production: https://your-domain.com/api
```

## Authentication

All authenticated endpoints require a valid JWT token in cookies or Authorization header.

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Google OAuth
```http
GET /auth/google
GET /auth/google/callback
```

### Logout
```http
POST /auth/logout
```

### Refresh Token
```http
POST /auth/refresh
```

---

## Documents

### Create Document
```http
POST /documents
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "My Document"
}
```

### Get All Documents
```http
GET /documents
Authorization: Bearer {token}
```

### Get Document by ID
```http
GET /documents/:id
Authorization: Bearer {token}
```

### Update Document
```http
PUT /documents/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "content": { "type": "doc", "content": [...] }
}
```

### Delete Document
```http
DELETE /documents/:id
Authorization: Bearer {token}
```

### Update Document Content
```http
PATCH /documents/:id/content
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": { "type": "doc", "content": [...] }
}
```

---

## Comments

### Get Comments
```http
GET /documents/:id/comments?includeResolved=false
Authorization: Bearer {token}
```

### Create Comment
```http
POST /documents/:id/comments
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "This is a comment",
  "selectedText": "highlighted text",
  "positionData": { "from": 0, "to": 10 }
}
```

### Add Reply
```http
POST /comments/:id/replies
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "This is a reply"
}
```

### Resolve Comment
```http
POST /comments/:id/resolve
Authorization: Bearer {token}
```

### Reopen Comment
```http
POST /comments/:id/reopen
Authorization: Bearer {token}
```

### Delete Comment
```http
DELETE /comments/:id
Authorization: Bearer {token}
```

### Delete Reply
```http
DELETE /comments/:commentId/replies/:replyId
Authorization: Bearer {token}
```

---

## Version History

### Get Versions
```http
GET /documents/:id/versions
Authorization: Bearer {token}
```

### Create Version
```http
POST /documents/:id/versions
Authorization: Bearer {token}
Content-Type: application/json

{
  "changeDescription": "Added introduction section"
}
```

### Restore Version
```http
POST /documents/:id/versions/:versionNumber/restore
Authorization: Bearer {token}
```

---

## Sharing & Permissions

### Share Document
```http
POST /documents/:id/share
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "user@example.com",
  "permission": "EDITOR"
}
```

**Permission Levels:**
- `OWNER` - Full control
- `EDITOR` - Edit, comment, create versions
- `COMMENTER` - View, comment
- `VIEWER` - View only

### Get Permissions
```http
GET /documents/:id/permissions
Authorization: Bearer {token}
```

### Update Permission
```http
PATCH /documents/:id/permissions/:permissionId
Authorization: Bearer {token}
Content-Type: application/json

{
  "permission": "VIEWER"
}
```

### Remove Permission
```http
DELETE /documents/:id/permissions/:permissionId
Authorization: Bearer {token}
```

---

## Search

### Search Documents
```http
GET /search?q=query&limit=20&offset=0
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "doc-id",
        "title": "Document Title",
        "excerpt": "...matching text...",
        "matchType": "title",
        "highlights": ["...text..."],
        "owner": { "id": "...", "name": "...", "email": "..." },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "commentCount": 5,
        "isShared": true
      }
    ],
    "total": 10,
    "took": 45
  }
}
```

### Get Recent Searches
```http
GET /search/recent
Authorization: Bearer {token}
```

---

## Export

### Export as Markdown
```http
GET /documents/:id/export/markdown
Authorization: Bearer {token}
```

### Export as Plain Text
```http
GET /documents/:id/export/text
Authorization: Bearer {token}
```

### Export as HTML
```http
GET /documents/:id/export/html
Authorization: Bearer {token}
```

### Export as PDF (Print)
```http
GET /documents/:id/export/pdf
Authorization: Bearer {token}
```

---

## Health Check

### Health Status
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "database": "connected",
  "memory": {
    "used": 150,
    "total": 512
  }
}
```

### Readiness Probe
```http
GET /health/ready
```

### Liveness Probe
```http
GET /health/live
```

---

## Socket.IO Events

### Connection
```javascript
const socket = io('http://localhost:3001', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});
```

### Document Collaboration

**Join Document:**
```javascript
socket.emit('join-document', documentId);
```

**Leave Document:**
```javascript
socket.emit('leave-document', documentId);
```

**Document Update:**
```javascript
socket.on('document-updated', (data) => {
  // { documentId, update, user }
});
```

### Comments

**Comment Created:**
```javascript
socket.on('comment-created', (data) => {
  // { documentId, comment }
});
```

**Comment Updated:**
```javascript
socket.on('comment-updated', (data) => {
  // { documentId, comment }
});
```

**Comment Deleted:**
```javascript
socket.on('comment-deleted', (data) => {
  // { documentId, commentId }
});
```

**Reply Added:**
```javascript
socket.on('reply-added', (data) => {
  // { documentId, commentId, reply }
});
```

### Presence Awareness

**User Joined:**
```javascript
socket.on('user-joined', (data) => {
  // { documentId, user }
});
```

**User Left:**
```javascript
socket.on('user-left', (data) => {
  // { documentId, userId }
});
```

**Active Users:**
```javascript
socket.on('active-users', (users) => {
  // Array of active users in document
});
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": ["Field is required"]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limiting

- **Default:** 100 requests per minute per IP
- **Authentication endpoints:** 5 requests per minute per IP
- **Search:** 30 requests per minute per user

---

## Best Practices

1. **Always include authentication** for protected endpoints
2. **Use pagination** for large datasets
3. **Handle errors gracefully** with proper error boundaries
4. **Implement retry logic** for failed requests
5. **Cache responses** where appropriate
6. **Use WebSockets** for real-time features
7. **Validate input** on both client and server
8. **Keep tokens secure** - store in httpOnly cookies

---

## SDK Examples

### JavaScript/TypeScript
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  withCredentials: true,
});

// Create document
const createDocument = async (title: string) => {
  const response = await api.post('/documents', { title });
  return response.data;
};

// Search documents
const searchDocuments = async (query: string) => {
  const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
  return response.data;
};
```

### Python
```python
import requests

API_URL = "http://localhost:3001"

def create_document(title, token):
    response = requests.post(
        f"{API_URL}/documents",
        json={"title": title},
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.json()
```

---

## Postman Collection

Import the API collection from: `postman_collection.json`

## Support

For questions or issues, please contact: support@yourapp.com