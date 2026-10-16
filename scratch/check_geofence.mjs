import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branches.findMany();
  console.log("=== BRANCHES ===");
  console.log(branches.map((b) => ({ id: b.id, name: b.name, lat: b.latitude, lng: b.longitude, radius: b.geofence_radius_m })));

  const sites = await prisma.work_locations.findMany();
  console.log("=== WORK LOCATIONS (SITES) ===");
  console.log(sites.map((s) => ({ id: s.id, name: s.name, lat: s.latitude, lng: s.longitude, radius: s.geofence_radius_m })));

  const employees = await prisma.employees.findMany({
    take: 5,
    select: { id: true, first_name: true, last_name: true, branch_id: true, default_work_location_id: true }
  });
  console.log("=== SAMPLE EMPLOYEES ===");
  console.log(employees);

  const recentAttendance = await prisma.attendance.findMany({
    take: 5,
    orderBy: { created_at: "desc" },
    select: { id: true, employee_id: true, date: true, clock_in: true, clock_in_latitude: true, clock_in_longitude: true, notes: true }
  });
  console.log("=== RECENT ATTENDANCE ===");
  console.log(recentAttendance);

  await prisma.$disconnect();
}

main().catch(console.error);
