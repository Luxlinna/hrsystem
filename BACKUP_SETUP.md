# Supabase PostgreSQL -> AWS S3 Automated Backup Guide

This guide provides instructions on how your Supabase database is backed up to your AWS S3 bucket automatically and on-demand.

---

## 🛠️ Components Overview

1. **GitHub Actions Workflow** (`.github/workflows/supabase-db-backup-s3.yml`):
   - **Daily Schedule**: Automatically triggers every day at 02:00 UTC (09:00 AM ICT).
   - **Manual Trigger**: Can be run on-demand from the GitHub **Actions** tab with a single click.
   - **Compression**: Creates an encrypted, level-9 gzipped `.sql.gz` dump.
   - **S3 Hierarchy**: Stored in `s3://[YOUR-BUCKET]/database-backups/YYYY-MM/hrsystem_backup_[TIMESTAMP].sql.gz` with a `database-backups/latest.sql.gz` pointer.

2. **Local / Node.js CLI Script** (`scripts/backup-db-to-s3.mjs`):
   - Run manually anytime via:
     ```bash
     npm run backup:s3
     ```

3. **Restore Script** (`scripts/restore-db-from-s3.mjs`):
   - Restores the latest or any specific backup from S3:
     ```bash
     npm run restore:s3
     # Or specific backup:
     npm run restore:s3 database-backups/2026-09/hrsystem_backup_2026-09-01_130000_manual.sql.gz
     ```

---

## 🔑 Required Secrets & Environment Variables

### 1. For GitHub Actions (Add under **GitHub Repo → Settings → Secrets & Variables → Actions**):

| Secret Name | Description | Example / Default |
|-------------|-------------|-------------------|
| `AWS_ACCESS_KEY_ID` | Your AWS IAM Access Key ID | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Your AWS IAM Secret Key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_S3_BUCKET` | Your AWS S3 Bucket Name | `my-hr-backups-bucket` |
| `AWS_S3_REGION` | AWS Region of the S3 Bucket | `ap-southeast-1` or `us-east-1` |
| `SUPABASE_PROJECT_REF` | Supabase Project Reference ID | Found in Supabase URL |
| `SUPABASE_DB_PASSWORD` | Supabase Database Postgres Password | Your DB password |
| `SUPABASE_DB_HOST` *(optional)* | Supabase Pooler / Host | `aws-0-ap-southeast-1.pooler.supabase.com` |
| `SUPABASE_DB_PORT` *(optional)* | Port (Session or Transaction) | `6543` or `5432` |

### 2. For Local `.env` Usage:

```env
AWS_ACCESS_KEY_ID=your_aws_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your_s3_bucket_name
AWS_S3_REGION=ap-southeast-1

# Direct Database Connection String
SUPABASE_DB_URL=postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

---

## 🚀 How to Run Backups

### Method 1: Automatic Scheduled Backups (Zero Maintenance)
The GitHub Actions workflow runs every night automatically. You can check the execution status in the **Actions** tab of your repository.

### Method 2: Manual Backup from GitHub
1. Go to your repository on GitHub.
2. Click **Actions** → select **Supabase Database Backup to AWS S3**.
3. Click **Run workflow** and optionally provide a tag (e.g. `pre-deployment-v2`).

### Method 3: Run from Terminal
```bash
npm run backup:s3
```

---

## 🔄 How to Restore a Database Backup

```bash
# Restore latest backup from S3 to your database
npm run restore:s3
```
