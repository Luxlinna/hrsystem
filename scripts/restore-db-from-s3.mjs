/**
 * AWS S3 -> Supabase / PostgreSQL Database Restore Script
 *
 * Usage:
 *   npm run restore:s3
 *   npm run restore:s3 database-backups/2026-09/hrsystem_backup_2026-09-01_130000.sql.gz
 *   npm run restore:s3 --list
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { pipeline } from "stream/promises";
import { S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_DB_URL =
  process.env.RESTORE_DB_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.DATABASE_URL;

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || process.env.AWS_S3_BACKUP_BUCKET || "hrsystem-ops";
const AWS_REGION = process.env.AWS_S3_REGION || process.env.AWS_REGION || "us-east-1";

async function runRestore() {
  console.log("==================================================");
  console.log("🔄 Starting Database Restore from AWS S3...");
  console.log("==================================================");

  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET) {
    console.error("❌ Missing AWS S3 credentials in environment variables.");
    process.exit(1);
  }

  const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  const arg = process.argv[2];

  // If user passes --list, list all available backups from S3
  if (arg === "--list") {
    console.log(`\n📋 Checking backups in s3://${AWS_S3_BUCKET}/database-backups/:`);
    try {
      const listRes = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: AWS_S3_BUCKET,
          Prefix: "database-backups/",
        })
      );

      const contents = listRes.Contents || [];
      if (contents.length === 0) {
        console.log("  (No backups found)");
      } else {
        for (const item of contents) {
          const sizeKB = (item.Size / 1024).toFixed(1);
          console.log(`  • ${item.Key} (${sizeKB} KB) — Modified: ${item.LastModified?.toISOString()}`);
        }
      }
    } catch (err) {
      console.warn("  ℹ️ S3 ListBucket permission not granted for this IAM user.");
      console.warn("  You can still restore directly using the default key: database-backups/latest.sql.gz");
    }
    console.log("==================================================");
    return;
  }

  const requestedKey = arg && !arg.startsWith("--") ? arg : "database-backups/latest.sql.gz";
  const tempDir = path.resolve("./.temp-backups");

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const localGzipPath = path.join(tempDir, "restore_download.sql.gz");
  const localSqlPath = path.join(tempDir, "restore_decompressed.sql");

  try {
    console.log(`\n📥 1. Downloading from AWS S3: s3://${AWS_S3_BUCKET}/${requestedKey}...`);

    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: AWS_S3_BUCKET,
        Key: requestedKey,
      })
    );

    const fileStream = fs.createWriteStream(localGzipPath);
    await pipeline(response.Body, fileStream);

    console.log("✅ Download complete.");

    console.log("\n📦 2. Decompressing gzip archive...");
    const gzipReadStream = fs.createReadStream(localGzipPath);
    const sqlWriteStream = fs.createWriteStream(localSqlPath);
    const gunzip = zlib.createGunzip();

    await pipeline(gzipReadStream, gunzip, sqlWriteStream);
    console.log(`✅ Decompressed SQL file ready: ${localSqlPath}`);

    const sqlContent = fs.readFileSync(localSqlPath, "utf8");
    const lineCount = sqlContent.split("\n").length;
    console.log(`📊 SQL size: ${(fs.statSync(localSqlPath).size / 1024).toFixed(1)} KB (${lineCount} lines)`);

    if (SUPABASE_DB_URL) {
      console.log("\n⚡ 3. Executing restore via psql onto target database...");
      await new Promise((resolve, reject) => {
        const psqlProcess = spawn(
          "psql",
          [SUPABASE_DB_URL, "-f", localSqlPath],
          { stdio: "inherit", shell: false }
        );

        psqlProcess.on("error", (err) => {
          reject(
            new Error(
              `psql failed to launch. Error: ${err.message}`
            )
          );
        });

        psqlProcess.on("close", (code) => {
          if (code === 0) resolve();
          else reject(new Error(`psql restore exited with code ${code}`));
        });
      });
      console.log("✅ psql execution finished.");
    } else {
      console.log(`\n💡 Note: SUPABASE_DB_URL / RESTORE_DB_URL not set in .env.`);
      console.log(`   The downloaded SQL file has been saved to: ${localSqlPath}`);
      console.log(`   You can run this SQL in your Supabase SQL Editor or against any Postgres database anytime.`);
    }

    console.log("\n==================================================");
    console.log("🎉 Database restore snapshot retrieved successfully!");
    console.log("==================================================");
  } catch (err) {
    console.error("\n❌ Restore failed with error:", err.message || err);
    process.exit(1);
  }
}

runRestore();
