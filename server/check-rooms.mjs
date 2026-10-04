import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const rooms = await prisma.$queryRawUnsafe(`
    SELECT r.id, r.name, r.branch_id, r.image_url, r.deleted_at, b.name as branch_name
    FROM public.meeting_rooms r
    LEFT JOIN public.branches b ON b.id = r.branch_id
    ORDER BY r.name;
  `);
  console.log("Current rooms in database:", JSON.stringify(rooms, null, 2));
  await prisma.$disconnect();
}

main();
