import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const emp = await prisma.employees.findUnique({
    where: { id: "d1d0e910-d472-42c3-8f6e-1eef21bf6f21" },
    include: { branches: true, work_locations: true }
  });
  console.log("EMPLOYEE:", JSON.stringify(emp, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
