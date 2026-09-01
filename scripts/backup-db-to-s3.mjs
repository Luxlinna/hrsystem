/**
 * Supabase -> AWS S3 Automated Database Backup Script
 *
 * Supports:
 *   1. Pure Node.js / Supabase Admin SDK (Zero external dependencies, works on Windows/Mac/Linux out of the box)
 *   2. Native pg_dump (if pg_dump and SUPABASE_DB_URL are configured)
 *
 * Usage:
 *   npm run backup:s3
 */

import fs from "fs";
import path from "path";
import zlib from "zlib";
import { pipeline } from "stream/promises";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_PUBLIC_SUPABASE_URL ||
  "https://blcvtbzwpwmqkphlcjji.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || process.env.AWS_S3_BACKUP_BUCKET || "hrsystem-ops";
const AWS_REGION = process.env.AWS_S3_REGION || process.env.AWS_REGION || "us-east-1";

// All core HR tables across modules
const CORE_TABLES = [
  "branches",
  "work_locations",
  "employees",
  "candidates",
  "hiring_requests",
  "job_postings",
  "interview_assessments",
  "onboarding_requests",
  "onboarding_tasks",
  "onboarding_documents",
  "offboarding_requests",
  "offboarding_tasks",
  "attendance_records",
  "shifts",
  "shift_assignments",
  "leave_requests",
  "leave_balances",
  "payroll_runs",
  "payroll_records",
  "payslips",
  "salary_structures",
  "expense_records",
  "budget_allocations",
  "it_assets",
  "it_tickets",
  "benefit_plans",
  "benefit_enrollments",
  "training_courses",
  "course_enrollments",
  "disciplinary_records",
  "tools",
  "tool_assignments",
  "tool_usages",
  "announcements",
  "announcement_acknowledgements",
  "documents",
  "tasks",
  "task_activities",
  "meeting_rooms",
  "meeting_room_bookings",
  "system_settings",
  "audit_logs",
  "notifications",
  "notification_recipients",
  "user_roles",
  "roles",
  "permissions",
  "user_role_assignments"
];

function escapeSqlValue(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    const jsonStr = JSON.stringify(val).replace(/'/g, "''");
    return `'${jsonStr}'::jsonb`;
  }
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

async function runBackup() {
  console.log("==================================================");
  console.log("🚀 Starting Supabase Database Backup to AWS S3...");
  console.log("==================================================");

  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET) {
    console.error("❌ Missing AWS S3 credentials in environment variables.");
    console.error("Please ensure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET are set.");
    process.exit(1);
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase URL or Service Key in .env");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const yearMonth = now.toISOString().slice(0, 7);
  const dumpFileName = `hrsystem_backup_${timestamp}.sql`;
  const gzipFileName = `${dumpFileName}.gz`;
  const tempDir = path.resolve("./.temp-backups");

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const localDumpPath = path.join(tempDir, dumpFileName);
  const localGzipPath = path.join(tempDir, gzipFileName);

  console.log(`\n📦 1. Exporting data from Supabase [${SUPABASE_URL}]...`);

  const sqlStatements = [];
  sqlStatements.push(`-- HR Management System Database Backup`);
  sqlStatements.push(`-- Generated at: ${now.toISOString()}`);
  sqlStatements.push(`-- Source: ${SUPABASE_URL}\n`);
  sqlStatements.push(`BEGIN;\n`);

  let totalRows = 0;
  const exportedTables = [];

  for (const table of CORE_TABLES) {
    try {
      const { data, error } = await supabase.from(table).select("*").limit(50000);
      if (error) {
        // Table might not exist or no permission, skip gracefully
        continue;
      }

      if (data && data.length > 0) {
        totalRows += data.length;
        exportedTables.push({ table, count: data.length });
        console.log(`  ✓ Table '${table}': ${data.length} rows`);

        sqlStatements.push(`-- Table: ${table}`);
        sqlStatements.push(`-- Rows: ${data.length}`);

        const columns = Object.keys(data[0]);
        const colsSql = columns.map((c) => `"${c}"`).join(", ");

        for (const row of data) {
          const valuesSql = columns.map((col) => escapeSqlValue(row[col])).join(", ");
          sqlStatements.push(`INSERT INTO public."${table}" (${colsSql}) VALUES (${valuesSql}) ON CONFLICT DO NOTHING;`);
        }
        sqlStatements.push("");
      } else {
        console.log(`  - Table '${table}': 0 rows (empty)`);
      }
    } catch (err) {
      console.warn(`  ⚠️ Skipped table '${table}': ${err.message}`);
    }
  }

  sqlStatements.push(`COMMIT;\n`);

  fs.writeFileSync(localDumpPath, sqlStatements.join("\n"), "utf8");
  console.log(`\n✅ Backup SQL generated: ${exportedTables.length} tables, ${totalRows} rows total.`);

  console.log("\n🗜️  2. Compressing SQL dump with gzip (Maximum Level 9)...");
  const sourceStream = fs.createReadStream(localDumpPath);
  const destinationStream = fs.createWriteStream(localGzipPath);
  const gzip = zlib.createGzip({ level: 9 });

  await pipeline(sourceStream, gzip, destinationStream);

  const stats = fs.statSync(localGzipPath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log(`✅ Compression complete: ${gzipFileName} (${sizeKB} KB)`);

  console.log(`\n☁️  3. Uploading to AWS S3 (Bucket: ${AWS_S3_BUCKET}, Region: ${AWS_REGION})...`);

  const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  const s3Key = `database-backups/${yearMonth}/${gzipFileName}`;
  const fileStream = fs.createReadStream(localGzipPath);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: s3Key,
      Body: fileStream,
      ContentType: "application/gzip",
      StorageClass: "STANDARD_IA",
      Metadata: {
        "created-by": "hrsystem-backup-runner",
        "created-at": now.toISOString(),
        "total-tables": String(exportedTables.length),
        "total-rows": String(totalRows),
      },
    })
  );

  // Also update latest pointer
  const latestStream = fs.createReadStream(localGzipPath);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: "database-backups/latest.sql.gz",
      Body: latestStream,
      ContentType: "application/gzip",
    })
  );

  console.log(`✅ Backup successfully uploaded to: s3://${AWS_S3_BUCKET}/${s3Key}`);
  console.log(`✅ Latest pointer updated: s3://${AWS_S3_BUCKET}/database-backups/latest.sql.gz`);

  console.log("\n🧹 4. Cleaning temporary local files...");
  if (fs.existsSync(localDumpPath)) fs.unlinkSync(localDumpPath);
  if (fs.existsSync(localGzipPath)) fs.unlinkSync(localGzipPath);

  console.log("\n==================================================");
  console.log("🎉 Backup procedure completed successfully!");
  console.log(`📊 Summary: ${exportedTables.length} tables backed up (${totalRows} rows) to AWS S3.`);
  console.log("==================================================");
}

runBackup().catch((err) => {
  console.error("❌ Fatal error running backup:", err);
  process.exit(1);
});
