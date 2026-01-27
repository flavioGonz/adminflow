# AI Agents Documentation

This document describes the AI agents and their roles within the AdminFlow project.

## Overview

AdminFlow uses a multi-layered architecture where different AI-driven features assist with administrative tasks, client management, and support ticket handling.

## Agents

### 1. Ticket Assistant
- **Role:** Assists operators in creating and managing support tickets.
- **Capabilities:**
  - Auto-categorization of tickets.
  - Suggesting priorities based on title and description.
  - Matching tickets with existing clients.
- **Integration points:** `client/components/clients/edit-ticket-dialog.tsx`, `server/index.js`.

### 2. Database Migration Agent
- **Role:** Handles the transition from SQLite to MongoDB.
- **Capabilities:**
  - Syncing local data to the cloud.
  - Ensuring data consistency during migration.
  - Mapping SQLite tables to MongoDB collections.
- **Tools used:** `server/lib/mongo-sync.js`, `server/scripts/migrate-all-to-mongo.js`.

### 3. Notification Agent
- **Role:** Manages automated communications with clients and staff.
- **Capabilities:**
  - Sending email notifications via SMTP.
  - Triggering events based on ticket status changes.
  - Logging all notification attempts in MongoDB.
- **Integration points:** `server/lib/notificationService.js`, `server/lib/emailTemplates.js`.

### 4. Audit & Security Agent
- **Role:** Monitors system actions and ensures data integrity.
- **Capabilities:**
  - Logging all administrative actions (CRUD operations).
  - Verifying installation state and security configurations.
  - Providing audit logs for troubleshooting.
- **Integration points:** `server/lib/auditService.js`, `server/lib/installationValidator.js`.

### 5. Hybrid Data Orchestrator
- **Role:** Manages the integration between SQLite (Legacy/Tickets) and MongoDB (Modern/Users).
- **Capabilities:**
  - Resolving ID conflicts between numeric SQLite IDs and hex MongoDB ObjectIDs.
  - Ensuring ticket creation stability when referencing migrated clients.
  - Normalizing data structures for the frontend regardless of the source database.
- **Integration points:** `server/index.js` (Ticket creation logic), `client/app/tickets/page.tsx` (normalizeTicket).

## Future Enhancements
- AI-driven predictive maintenance for client hardware.
- Automated response suggestions for support articles.
- Smart scheduling for technician visits based on priority and location.
