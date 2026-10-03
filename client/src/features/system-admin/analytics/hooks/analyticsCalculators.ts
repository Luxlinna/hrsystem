import type { Employee, LeaveRequest, PayrollRecord, ExpenseRecord, ITAsset, ITTicket } from "../types";

export function calculateAvgTenure(employees: Employee[]) {
  const now = new Date();
  const total = employees.reduce((s, e) => s + (e.join_date ? (now.getTime() - new Date(e.join_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25) : 0), 0);
  return employees.length ? (total / employees.length).toFixed(1) : "0";
}

export function calculateLeaveStats(leaveRequests: LeaveRequest[], empMap: Map<string, Employee>) {
  const byType: Record<string, number> = {};
  const byDept: Record<string, number> = {};
  leaveRequests.forEach((l) => {
    byType[l.leave_type] = (byType[l.leave_type] || 0) + l.days;
    const emp = empMap.get(l.employee_id);
    if (emp) byDept[emp.department] = (byDept[emp.department] || 0) + (l.days || 0);
  });
  return {
    leaveByType: Object.entries(byType).map(([name, value]) => ({ name: name.replace(/_/g, " "), value })),
    leaveByDept: Object.entries(byDept).map(([name, days]) => ({ name, days })),
  };
}

export function calculateSalaryByDept(payroll: PayrollRecord[], empMap: Map<string, Employee>) {
  const d: Record<string, { total: number; count: number }> = {};
  payroll.forEach((p) => {
    const emp = empMap.get(p.employee_id);
    if (emp) {
      if (!d[emp.department]) d[emp.department] = { total: 0, count: 0 };
      d[emp.department].total += Number(p.net_pay || 0);
      d[emp.department].count += 1;
    }
  });
  return Object.entries(d).map(([name, data]) => ({
    name,
    total: Math.round(data.total / 1000),
    avg: Math.round((data.total / data.count) / 1000),
    count: data.count,
  }));
}

export function calculateExpenseStats(expenses: ExpenseRecord[]) {
  const byCat: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  expenses.forEach((e) => {
    byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount || 0);
    byStatus[e.status] = (byStatus[e.status] || 0) + Number(e.amount || 0);
  });
  return {
    expenseByCategory: Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value: Math.round(value) })),
    expenseByStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value: Math.round(value) })),
  };
}

export function calculateITStats(itAssets: ITAsset[], itTickets: ITTicket[]) {
  const assetTypes: Record<string, number> = {};
  const assetStatus: Record<string, number> = {};
  itAssets.forEach((a) => {
    assetTypes[a.type] = (assetTypes[a.type] || 0) + 1;
    assetStatus[a.status] = (assetStatus[a.status] || 0) + 1;
  });

  const ticketPriority: Record<string, number> = {};
  const ticketStatus: Record<string, number> = {};
  itTickets.forEach((t) => {
    ticketPriority[t.priority] = (ticketPriority[t.priority] || 0) + 1;
    ticketStatus[t.status] = (ticketStatus[t.status] || 0) + 1;
  });

  return {
    itAssetsByType: Object.entries(assetTypes).map(([name, value]) => ({ name: name.replace(/_/g, " "), value })),
    itAssetsByStatus: Object.entries(assetStatus).map(([name, value]) => ({ name, value })),
    ticketsByPriority: Object.entries(ticketPriority).map(([name, value]) => ({ name, value })),
    ticketsByStatus: Object.entries(ticketStatus).map(([name, value]) => ({ name, value })),
  };
}
