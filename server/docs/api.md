# HRSystem Backend API Documentation

## Base URL
- Production: `https://api.hrmsystem.local/api/v1`
- Development: `http://localhost:4000/api/v1`

---

## Health & Probes
- `GET /health` - System health probe (Uptime, Memory, Status)
- `GET /health/ready` - Readiness check (Database connectivity)

---

## Biometric ADMS
- `GET /iclock/cdata` - Handshake & ping from ZKTeco biometric terminals
- `POST /iclock/cdata` - Push realtime attendance logs from device

---

## Core Resources
- `/auth` - Authentication & token verification
- `/employees` - Employee CRUD & profile management
- `/attendance` - Attendance logs, daily check-in / check-out
- `/leave` - Leave requests & approvals
- `/settings` - Company settings & configuration
