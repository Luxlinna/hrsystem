import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Updating branch GPS coordinates in Supabase PostgreSQL...");

  // 1. UNI Building branches (UNI Holding, Unique Noble Investment, Unique Noble Trading)
  const uniRes = await prisma.branches.updateMany({
    where: {
      name: {
        in: [
          "UNIQUE NOBLE INVESTMENT CO., LTD",
          "UNIQUE NOBLE TRADING CO., LTD",
          "UNI Holding"
        ]
      }
    },
    data: {
      latitude: 11.567043,
      longitude: 104.892548,
      geofence_radius_m: 100
    }
  });
  console.log("Updated UNI Building branches:", uniRes.count);

  // 2. Pinex Salon
  const salonRes = await prisma.branches.updateMany({
    where: { name: "PINEX SALON CO., LTD" },
    data: {
      latitude: 11.558452,
      longitude: 104.92108,
      geofence_radius_m: 100
    }
  });
  console.log("Updated Pinex Salon branch:", salonRes.count);

  // 3. Other head-office based entities missing coordinates
  const headRes = await prisma.branches.updateMany({
    where: {
      name: {
        in: [
          "SOVANNAPHUMI HANDCRAFT",
          "TRADEX PRIME CO., LTD",
          "Pursat Orange"
        ]
      }
    },
    data: {
      latitude: 11.566881,
      longitude: 104.892527,
      geofence_radius_m: 100
    }
  });
  console.log("Updated other branches with Head Office coordinates:", headRes.count);

  // 4. Update Dararithy Thorng to default to UNI Building
  const dararithy = await prisma.employees.updateMany({
    where: { id: "d1d0e910-d472-42c3-8f6e-1eef21bf6f21" },
    data: {
      default_work_location_id: "e272e2a8-f03e-4d12-b551-d2237843be1f"
    }
  });
  console.log("Updated Dararithy default work location:", dararithy.count);

  // 5. Verify all branches now have latitude and longitude
  const allBranches = await prisma.branches.findMany({
    select: { id: true, name: true, latitude: true, longitude: true, geofence_radius_m: true }
  });
  console.log("All branches status:");
  console.log(allBranches.map((b) => `${b.name}: (${b.latitude}, ${b.longitude}) - ${b.geofence_radius_m}m`));

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
