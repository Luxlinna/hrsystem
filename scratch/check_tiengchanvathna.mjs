import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const res = await prisma.employees.findMany({
    where: {
      OR: [
        { first_name: { contains: "Tiengchanvathna", mode: "insensitive" } },
        { last_name: { contains: "Tiengchanvathna", mode: "insensitive" } },
        { position: { contains: "HR & Admin", mode: "insensitive" } }
      ]
    },
    include: { branches: true, work_locations: true }
  });
  console.log("MATCHING EMPLOYEES:", JSON.stringify(res.map(x => ({
    id: x.id,
    name: x.first_name + " " + x.last_name,
    role: x.role,
    pos: x.position,
    branch: x.branches?.name,
    bu: x.bu_full_name,
    div: x.division,
    dept: x.department,
    site: x.site,
    supervisor: x.line_manager,
    contract_type: x.contract_type,
    join_date: x.join_date,
    start_date: x.start_date,
    contract_end_date: x.contract_end_date,
    basic_salary: x.basic_salary,
    contract_rate: x.contract_rate,
    contract_rate_after: x.contract_rate_after
  })), null, 2));

  const movements = await prisma.employee_movements.findMany({
    take: 5,
    orderBy: { created_at: "desc" }
  });
  console.log("MOVEMENTS:", JSON.stringify(movements, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
