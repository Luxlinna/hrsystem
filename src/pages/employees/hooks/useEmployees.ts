import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import type {
  Employee,
  Branch,
  AppRole,
  AccountStatus,
  EmployeeFormState,
  VisibleColumns,
  SortField,
  SortDirection,
  ViewMode,
} from "../types";
import {
  INITIAL_EMPLOYEE_FORM,
  INITIAL_VISIBLE_COLUMNS,
  COLUMN_WIDTHS,
} from "../constants";
import { exportEmployeesCSV } from "../exportUtils";

export function useEmployees() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const {
    isSuperAdmin,
    isBranchAdmin,
    effectiveBranchId,
    userBranchId,
    userBranchName,
    branches: scopeBranches,
  } = useBranchScope();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const canManage = isAdmin || isBranchAdmin || !!role?.employees_manage;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterAccount, setFilterAccount] = useState("");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<EmployeeFormState>(INITIAL_EMPLOYEE_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [managerEmails, setManagerEmails] = useState<Set<string>>(new Set());
  const [accountStatus, setAccountStatus] = useState<Record<string, AccountStatus>>({});
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(INITIAL_VISIBLE_COLUMNS);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const loadEmployees = useCallback(() => {
    supabase
      .from("employees")
      .select("id, first_name, last_name, email, phone, role, department, branch_id, status, join_date, reports_to, avatar_url, branches(name)")
      .is("deleted_at", null)
      .order("first_name")
      .then(({ data, error }) => {
        if (error) {
          toast("Error", "Failed to load employee directory", "error");
          return;
        }
        const formatted = (data || []).map((x: any) => ({
          ...x,
          branches: Array.isArray(x.branches) ? x.branches[0] : x.branches || null
        })) as Employee[];
        setEmployees(formatted);
      });
  }, []);

  useEffect(() => {
    loadEmployees();
    supabase.from("branches").select("id, name").order("name").then(({ data }) => setBranches(data || []));
    supabase.from("app_roles").select("id, name, color").order("name").then(({ data }) => setRoles(data || []));
    supabase
      .from("user_role_assignments")
      .select("email, app_roles(name)")
      .is("deleted_at", null)
      .then(({ data }) => {
        if (!data) return;
        const emails = new Set<string>();
        data.forEach((row: any) => {
          const roleName = row.app_roles?.name || "";
          if (/manager/i.test(roleName)) emails.add(row.email?.toLowerCase());
        });
        setManagerEmails(emails);
      });
  }, [loadEmployees]);

  // Load account status for each employee
  useEffect(() => {
    const emails = employees.map((e) => e.email);
    if (emails.length === 0) return;
    supabase.rpc("get_user_account_status", { emails }).then(({ data }) => {
      if (data) {
        const statusMap: Record<string, AccountStatus> = {};
        data.forEach((row: any) => {
          statusMap[row.email] = { invited: row.invited, hasAccount: row.has_account };
        });
        setAccountStatus(statusMap);
      }
    });
  }, [employees]);

  useEffect(() => {
    setPage(1);
  }, [search, filterDept, filterStatus, filterBranch, filterAccount]);

  const depts = useMemo(() => Array.from(new Set(employees.map((e) => e.department).filter(Boolean))), [employees]);
  const branchCount = useMemo(() => new Set(employees.map((e) => e.branch_id).filter(Boolean)).size, [employees]);
  const managers = useMemo(
    () => employees.filter((employee) => managerEmails.has(employee.email?.toLowerCase())),
    [employees, managerEmails]
  );

  // Dashboard statistics
  const stats = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((e) => e.status === "active").length,
      onboarding: employees.filter((e) => e.status === "onboarding").length,
      withAccounts: Object.values(accountStatus).filter((acc) => acc.hasAccount).length,
      invited: Object.values(accountStatus).filter((acc) => acc.invited && !acc.hasAccount).length,
      byDepartment: depts.reduce((acc, dept) => {
        if (dept) acc[dept] = employees.filter((e) => e.department === dept).length;
        return acc;
      }, {} as Record<string, number>),
    }),
    [employees, accountStatus, depts]
  );

  const filtered = useMemo(() => {
    return employees
      .filter((e) => {
        const matchesSearch = `${e.first_name} ${e.last_name} ${e.email} ${e.role || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesDept = !filterDept || e.department === filterDept;
        const matchesStatus = !filterStatus || e.status === filterStatus;
        const targetBranch = filterBranch || effectiveBranchId;
        const matchesBranch = !targetBranch || e.branch_id === targetBranch;
        const acc = accountStatus[e.email];
        const matchesAccount =
          !filterAccount ||
          (filterAccount === "has_account" && acc?.hasAccount) ||
          (filterAccount === "invited" && acc?.invited && !acc?.hasAccount) ||
          (filterAccount === "no_account" && !acc?.hasAccount && !acc?.invited);
        return matchesSearch && matchesDept && matchesStatus && matchesBranch && matchesAccount;
      })
      .sort((a, b) => {
        if (!sortField) return 0;
        const aValue = sortField === "branch" ? a.branches?.name : a[sortField];
        const bValue = sortField === "branch" ? b.branches?.name : b[sortField];
        const comparison = String(aValue || "").localeCompare(String(bValue || ""));
        return sortDirection === "asc" ? comparison : -comparison;
      });
  }, [employees, search, filterDept, filterStatus, filterBranch, filterAccount, accountStatus, sortField, sortDirection]);

  const empTotalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const empSafePage = Math.min(page, empTotalPages);
  const empPageStart = filtered.length === 0 ? 0 : (empSafePage - 1) * pageSize + 1;
  const empPageEnd = Math.min(empSafePage * pageSize, filtered.length);
  const pagedEmployees = useMemo(
    () => filtered.slice((empSafePage - 1) * pageSize, empSafePage * pageSize),
    [filtered, empSafePage, pageSize]
  );

  const tableColumns = useMemo(
    () => [
      "employee",
      ...(visibleColumns.role ? ["role"] : []),
      ...(visibleColumns.department ? ["department"] : []),
      ...(visibleColumns.branch ? ["branch"] : []),
      ...(visibleColumns.status ? ["status"] : []),
      ...(visibleColumns.account ? ["account"] : []),
      ...(visibleColumns.joinDate ? ["joinDate"] : []),
      ...(visibleColumns.actions && canManage ? ["actions"] : []),
    ],
    [visibleColumns, canManage]
  );

  const tableGridStyle = useMemo(
    () => ({ "--emp-cols": tableColumns.map((c) => COLUMN_WIDTHS[c]).join(" ") } as React.CSSProperties),
    [tableColumns]
  );

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField]
  );

  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pagedEmployees.map((e) => e.id)));
    }
    setSelectAll(!selectAll);
  }, [selectAll, pagedEmployees]);

  const handleSelectOne = useCallback(
    (id: string) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedIds(newSelected);
      setSelectAll(newSelected.size === pagedEmployees.length);
    },
    [selectedIds, pagedEmployees.length]
  );

  const bulkInvite = useCallback(async () => {
    if (!canManage || selectedIds.size === 0) return;
    const selectedEmployees = employees.filter((e) => selectedIds.has(e.id));
    let successCount = 0;

    for (const employee of selectedEmployees) {
      const acc = accountStatus[employee.email];
      if (acc?.hasAccount || acc?.invited) continue;

      try {
        const { data, error } = await supabase.functions.invoke("invite-user", {
          body: {
            email: employee.email,
            display_name: `${employee.first_name} ${employee.last_name}`,
            role_id: roles.find((r) => r.name === employee.role)?.id || null,
            redirect_to: `${import.meta.env.VITE_APP_URL.replace(/\/$/, "")}/reset-password`,
          },
        });
        const fnError = error || data?.error;
        if (fnError) {
          console.error(`Failed to invite ${employee.email}:`, fnError);
        } else {
          successCount++;
          setAccountStatus((prev) => ({ ...prev, [employee.email]: { invited: true, hasAccount: false } }));
        }
      } catch (err) {
        console.error(`Failed to invite ${employee.email}:`, err);
      }
    }

    if (successCount > 0) {
      toast("Bulk invitations sent", `${successCount} employee(s) invited successfully`, "success");
    }
    setSelectedIds(new Set());
    setSelectAll(false);
  }, [canManage, selectedIds, employees, accountStatus, roles]);

  const bulkDelete = useCallback(async () => {
    if (!canManage || selectedIds.size === 0) return;
    if (!confirm(`Move ${selectedIds.size} employee(s) to the Recycle Bin?`)) return;

    const selectedEmployees = employees.filter((e) => selectedIds.has(e.id));
    let successCount = 0;

    for (const employee of selectedEmployees) {
      const { error } = await supabase
        .from("employees")
        .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
        .eq("id", employee.id);

      if (!error) {
        successCount++;
        logActivity({
          module: "employees",
          action: "deleted",
          entityType: "employee",
          entityId: employee.id,
          actorName,
          actorRole: role?.name || "Unknown",
          description: `${employee.first_name} ${employee.last_name} moved to the Recycle Bin (bulk)`,
        });
      }
    }

    if (successCount > 0) {
      toast("Bulk delete completed", `${successCount} employee(s) moved to Recycle Bin`, "success");
      loadEmployees();
    }
    setSelectedIds(new Set());
    setSelectAll(false);
  }, [canManage, selectedIds, employees, actorName, role?.name, loadEmployees]);

  const handleExportCSV = useCallback(() => {
    exportEmployeesCSV(filtered, accountStatus);
  }, [filtered, accountStatus]);

  const handleAddEmployee = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim() || !canManage) return;
      setSubmitting(true);
      const assignedBranch = (!isSuperAdmin && userBranchId) ? userBranchId : (form.branch_id || effectiveBranchId || null);
      const { data, error } = await supabase
        .from("employees")
        .insert({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          role: form.role.trim() || null,
          department: form.department || null,
          branch_id: assignedBranch,
          status: form.status,
          join_date: form.join_date,
          reports_to: form.reports_to || null,
        })
        .select()
        .single();
      setSubmitting(false);
      if (error) {
        toast(
          "Error",
          error.code === "23505" ? "An employee with that email already exists." : "Failed to add employee",
          "error"
        );
        return;
      }
      toast("Employee added", `${form.first_name} ${form.last_name} added to the directory`, "success");
      logActivity({
        module: "employees",
        action: "created",
        entityType: "employee",
        entityId: data.id,
        actorName,
        actorRole: role?.name || "Unknown",
        description: `${form.first_name} ${form.last_name} added to the employee directory`,
      });
      notify({
        source: "employees",
        type: "info",
        title: "New employee added",
        message: `${form.first_name} ${form.last_name} (${form.role || "no title"}) joined ${
          form.department || "the company"
        }.`,
        entityId: data.id,
      });

      // Pre-provision user_role_assignments by email (so they can be invited)
      await supabase.from("user_role_assignments").upsert(
        {
          email: form.email.trim(),
          display_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
          role_id: roles.find((r) => r.name === form.role.trim())?.id || null,
        },
        { onConflict: "email" }
      );

      setForm(INITIAL_EMPLOYEE_FORM);
      setShowAddModal(false);
      loadEmployees();
    },
    [form, canManage, actorName, role?.name, roles, loadEmployees]
  );

  const inviteUser = useCallback(
    async (e: Employee) => {
      if (!canManage) return;
      setInvitingId(e.id);
      try {
        const { data, error } = await supabase.functions.invoke("invite-user", {
          body: {
            email: e.email,
            display_name: `${e.first_name} ${e.last_name}`,
            role_id: roles.find((r) => r.name === e.role)?.id || null,
            redirect_to: `${import.meta.env.VITE_APP_URL.replace(/\/$/, "")}/reset-password`,
          },
        });
        const fnError = error || data?.error;
        if (fnError)
          throw new Error(typeof fnError === "string" ? fnError : fnError.message || "Invite failed");
        toast("Invitation sent", `An invite link was sent to ${e.email}`, "success");
        setAccountStatus((prev) => ({ ...prev, [e.email]: { invited: true, hasAccount: false } }));
      } catch (err: any) {
        toast("Invite failed", err.message || "Could not send invitation", "error");
      } finally {
        setInvitingId(null);
      }
    },
    [canManage, roles]
  );

  const deleteEmployee = useCallback(
    async (employee: Employee) => {
      if (!canManage) return;
      const name = `${employee.first_name} ${employee.last_name}`;
      if (!confirm(`Move "${name}" to the Recycle Bin? The employee can be restored later.`)) return;

      setDeletingId(employee.id);
      const { error } = await supabase
        .from("employees")
        .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
        .eq("id", employee.id);
      setDeletingId(null);

      if (error) {
        toast("Error", "Failed to move employee to the Recycle Bin", "error");
        return;
      }

      toast("Employee moved to Recycle Bin", `${name} can be restored from the Recycle Bin.`, "success");
      logActivity({
        module: "employees",
        action: "deleted",
        entityType: "employee",
        entityId: employee.id,
        actorName,
        actorRole: role?.name || "Unknown",
        description: `${name} moved to the Recycle Bin`,
      });
      loadEmployees();
    },
    [canManage, actorName, role?.name, loadEmployees]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        (document.querySelector('input[type="text"]') as HTMLElement)?.focus();
      }
      if (e.key === "Escape" && selectedIds.size > 0) {
        setSelectedIds(new Set());
        setSelectAll(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds.size]);

  useEffect(() => {
    if (page > empTotalPages) setPage(empTotalPages);
  }, [page, empTotalPages]);

  return {
    canManage,
    isSuperAdmin,
    isBranchAdmin,
    effectiveBranchId,
    userBranchId,
    userBranchName,
    employees,
    branches,
    search,
    setSearch,
    filterDept,
    setFilterDept,
    filterStatus,
    setFilterStatus,
    filterBranch,
    setFilterBranch,
    filterAccount,
    setFilterAccount,
    sortField,
    sortDirection,
    selectedIds,
    selectAll,
    pageSize,
    setPageSize,
    page,
    setPage,
    showAddModal,
    setShowAddModal,
    form,
    setForm,
    submitting,
    roles,
    managerEmails,
    accountStatus,
    invitingId,
    deletingId,
    showFilters,
    setShowFilters,
    showColumnMenu,
    setShowColumnMenu,
    visibleColumns,
    setVisibleColumns,
    viewMode,
    setViewMode,
    depts,
    branchCount,
    managers,
    stats,
    filtered,
    empTotalPages,
    empSafePage,
    empPageStart,
    empPageEnd,
    pagedEmployees,
    tableColumns,
    tableGridStyle,
    handleSort,
    handleSelectAll,
    handleSelectOne,
    bulkInvite,
    bulkDelete,
    handleExportCSV,
    handleAddEmployee,
    inviteUser,
    deleteEmployee,
  };
}
