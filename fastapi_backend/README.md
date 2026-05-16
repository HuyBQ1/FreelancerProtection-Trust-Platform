# Dispute Management FastAPI Module

## Folder structure

```text
fastapi_backend/
  requirements.txt
  app/
    main.py
    auth/dependencies.py
    core/config.py
    db/mongodb.py
    routers/disputes.py
    schemas/disputes.py
    services/audit_service.py
    services/dispute_service.py
    utils/object_id.py
```

## Run

```bash
cd fastapi_backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Required environment variables are read from the repo `.env`:

```env
MONGODB_URI=...
JWT_SECRET=...
```

## MongoDB documents

### disputes

```json
{
  "_id": "665f1f3a9e7b1a2d3c4e5678",
  "contractId": "665f1ee49e7b1a2d3c4e1111",
  "milestoneId": "milestone-1",
  "raisedBy": "665f1dd49e7b1a2d3c4e2222",
  "againstUser": "665f1cc49e7b1a2d3c4e3333",
  "category": "PAYMENT_NOT_RELEASED",
  "title": "Payment was not released",
  "description": "Milestone was approved but payment is still pending.",
  "status": "OPEN",
  "resolution": "",
  "escrowStatus": "LOCKED",
  "createdAt": "2026-05-10T10:00:00Z",
  "updatedAt": "2026-05-10T10:00:00Z"
}
```

### dispute_evidence

```json
{
  "_id": "665f1f3a9e7b1a2d3c4e9999",
  "disputeId": "665f1f3a9e7b1a2d3c4e5678",
  "uploadedBy": "665f1dd49e7b1a2d3c4e2222",
  "evidenceType": "GITHUB_LINK",
  "fileUrl": "https://github.com/example/repo/pull/1",
  "description": "Final deliverable pull request",
  "createdAt": "2026-05-10T10:05:00Z"
}
```

### dispute_responses

```json
{
  "_id": "665f1f3a9e7b1a2d3c4e8888",
  "disputeId": "665f1f3a9e7b1a2d3c4e5678",
  "senderId": "665f1cc49e7b1a2d3c4e3333",
  "message": "I need clarification on the submitted files.",
  "createdAt": "2026-05-10T10:08:00Z"
}
```

### audit_logs

```json
{
  "_id": "665f1f3a9e7b1a2d3c4e7777",
  "actorId": "665f1dd49e7b1a2d3c4e2222",
  "action": "DISPUTE_CREATED",
  "entityType": "DISPUTE",
  "entityId": "665f1f3a9e7b1a2d3c4e5678",
  "metadata": { "contractId": "665f1ee49e7b1a2d3c4e1111" },
  "createdAt": "2026-05-10T10:00:00Z"
}
```

## curl examples

Replace `$TOKEN` with a JWT from the existing app.

```bash
curl -X POST http://localhost:8000/disputes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": "665f1ee49e7b1a2d3c4e1111",
    "milestoneId": "milestone-1",
    "againstUser": "665f1cc49e7b1a2d3c4e3333",
    "category": "PAYMENT_NOT_RELEASED",
    "title": "Payment not released",
    "description": "The work was approved but payment has not been released."
  }'
```

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/disputes
```

```bash
curl -X POST http://localhost:8000/disputes/{id}/evidence \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"evidenceType":"GITHUB_LINK","fileUrl":"https://github.com/example/repo","description":"Deliverable link"}'
```

```bash
curl -X POST http://localhost:8000/disputes/{id}/responses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Please review the attached evidence."}'
```

```bash
curl -X PATCH http://localhost:8000/disputes/{id}/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"RESOLVED","adminAction":"APPROVE_FREELANCER","resolution":"Funds should be released to freelancer."}'
```
