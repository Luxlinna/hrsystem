# Database Architecture & Prisma Setup

## Overview
HRSystem uses **Supabase PostgreSQL** as its primary relational store, managed via **Prisma ORM** with connection pooling.

---

## Connection Modes
- **Pooled Connection (`DATABASE_URL`)**: Port 6543 via PgBouncer for transaction handling.
- **Direct Connection (`DIRECT_URL`)**: Port 5432 for schema migrations and DDL operations.

---

## Key Models
- `User` & `UserProfile` - Authentication and role scopes.
- `Employee` - Core employee details, branch assignment, and status.
- `Branch` & `Department` - Organization hierarchy and multi-branch privacy.
- `Position` - Roles and job titles.
- `AttendanceRecord` - Daily attendance logs and biometric device sync.
- `LeaveRequest` - Leave management workflow.
