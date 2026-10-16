import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  console.log("Checking attendance records for date:", today);

  const todayRecords = await prisma.$queryRawUnsafe(`
    SELECT 
      ar.id,
      ar.employee_id,
      e.first_name,
      e.last_name,
      e.branch_id,
      e.default_work_location_id,
      b.name as branch_name,
      b.latitude as branch_lat,
      b.longitude as branch_lng,
      b.geofence_radius_m as branch_radius,
      wl.name as site_name,
      wl.latitude as site_lat,
      wl.longitude as site_lng,
      wl.geofence_radius_m as site_radius,
      ar.date,
      ar.clock_in,
      ar.clock_out,
      ar.status,
      ar.notes,
      ar.created_at
    FROM attendance_records ar
    LEFT JOIN employees e ON e.id = ar.employee_id
    LEFT JOIN branches b ON b.id = e.branch_id
    LEFT JOIN work_locations wl ON wl.id = e.default_work_location_id
    WHERE ar.date >= '2026-10-15'
    ORDER BY ar.created_at DESC;
  `);

  console.log("=== ATTENDANCE FOR TODAY / YESTERDAY ===");
  console.log(JSON.stringify(todayRecords, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
