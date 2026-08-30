import { memo, useState, useMemo } from "react";
import type { Task, Employee } from "../../types";
import { TaskReportsToolbar } from "./TaskReportsToolbar";
import { TaskReportEmployeeCard, type EmployeeReportData } from "./TaskReportEmployeeCard";

interface TaskReportsViewProps {
  tasks: Task[];
  employees: Employee[];
  onSelectTask: (task: Task) => void;
}

export const TaskReportsView = memo(function TaskReportsView({
  tasks,
  employees,
  onSelectTask,
}: TaskReportsViewProps) {
  const [reportSearch, setReportSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [datePreset, setDatePreset] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [activeExportMenu, setActiveExportMenu] = useState<string | null>(null);

  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => e.department && set.add(e.department));
    return Array.from(set).sort();
  }, [employees]);

  const dateFilteredTasks = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    return tasks.filter((t) => {
      const taskDate = t.due_date || t.created_at.slice(0, 10);
      if (datePreset === "today") return taskDate === todayStr;
      if (datePreset === "week") {
        const diff = (now.getTime() - new Date(taskDate).getTime()) / (1000 * 3600 * 24);
        return diff >= 0 && diff <= 7;
      }
      if (datePreset === "month") {
        return taskDate.startsWith(todayStr.slice(0, 7));
      }
      if (datePreset === "custom") {
        if (customFrom && taskDate < customFrom) return false;
        if (customTo && taskDate > customTo) return false;
      }
      return true;
    });
  }, [tasks, datePreset, customFrom, customTo]);

  const employeeReports: EmployeeReportData[] = useMemo(() => {
    return employees
      .filter((e) => {
        if (deptFilter !== "all" && e.department !== deptFilter) return false;
        if (reportSearch.trim()) {
          const q = reportSearch.toLowerCase().trim();
          const name = `${e.first_name} ${e.last_name}`.toLowerCase();
          const dept = (e.department || "").toLowerCase();
          return name.includes(q) || dept.includes(q);
        }
        return true;
      })
      .map((emp) => {
        const empTasks = dateFilteredTasks.filter((t) => t.assigned_to === emp.id);
        const done = empTasks.filter((t) => t.status === "done").length;
        const inProg = empTasks.filter((t) => t.status === "in_progress").length;
        const todo = empTasks.filter((t) => t.status === "todo").length;
        const outsideWorkCount = empTasks.filter((t) => t.is_outside_work).length;

        return {
          employee: emp,
          tasks: empTasks,
          total: empTasks.length,
          done,
          inProg,
          todo,
          outsideWorkCount,
          completionRate: empTasks.length > 0 ? Math.round((done / empTasks.length) * 100) : 0,
        };
      })
      .filter((r) => r.tasks.length > 0 || !reportSearch.trim());
  }, [employees, dateFilteredTasks, deptFilter, reportSearch]);

  return (
    <div className="space-y-5">
      <TaskReportsToolbar
        datePreset={datePreset}
        setDatePreset={setDatePreset}
        customFrom={customFrom}
        setCustomFrom={setCustomFrom}
        customTo={customTo}
        setCustomTo={setCustomTo}
        reportSearch={reportSearch}
        setReportSearch={setReportSearch}
        deptFilter={deptFilter}
        setDeptFilter={setDeptFilter}
        departments={departments}
        dateFilteredTasks={dateFilteredTasks}
        totalEmployeesCount={employees.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {employeeReports.map((rep) => (
          <TaskReportEmployeeCard
            key={rep.employee.id}
            rep={rep}
            activeExportMenu={activeExportMenu}
            setActiveExportMenu={setActiveExportMenu}
            onSelectTask={onSelectTask}
          />
        ))}
      </div>
    </div>
  );
});
