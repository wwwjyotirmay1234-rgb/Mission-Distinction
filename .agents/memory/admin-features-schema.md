---
name: Admin 12-feature schema and routes
description: New DB tables, API routes, and frontend pages added for the 12 premium admin features
---

## New DB Tables (added via migrate.ts, already applied)
- `audit_logs` — adminId, adminName, action, entityType, entityId, details(jsonb), createdAt
- `student_warnings` — userId, issuedBy, issuedByName, reason, severity(warning/strike/final), seenAt, createdAt
- `content_reports` — reporterId, contentType, contentId, contentPreview, reason, status(pending/dismissed/removed), reviewedBy/At, createdAt
- `pinned_notices` — createdBy, message, type(info/warning/success/alert), isActive, expiresAt, createdAt
- ALTER announcements: added scheduled_for, delivered_count, target_audience columns

## Audit log utility
- `artifacts/api-server/src/lib/auditLog.ts` — fire-and-forget `logAudit(adminId, adminName, action, entityType?, entityId?, details?)` 

## API Routes (all at /api/admin/*)
- activity-feed → activityFeed.ts (GET /)
- moderation → moderation.ts (POST /report, GET /reports?status=, PATCH /:id/dismiss, DELETE /:id/remove)
- warnings → warningsRoute.ts (GET /my, PATCH /:id/seen, POST /, GET /user/:userId, GET /summary)
- audit-logs → auditLogsRoute.ts (GET /?days=)
- notices → notices.ts (GET /active for students, GET / admin list, POST /, DELETE /:id)
- quiz-intelligence → quizIntelligence.ts (GET /overview, GET /quiz/:id/distribution, GET /feature-usage, GET /heatmap, GET /student-report/:userId)

**Why:** quizAttemptsTable uses `createdAt` NOT `completedAt` and has NO `timeTaken` column.
