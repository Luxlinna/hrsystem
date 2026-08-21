import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";

const DEPARTMENTS = ["Engineering", "Sales", "Operations", "Marketing", "Finance", "HR", "IT", "Legal", "Executive", "Customer Service"];

// Raw db values (e.g. "on_leave") were rendering straight through with a
// literal underscore — `capitalize` only touches the first letter, it
// doesn't turn snake_case into words. This is the single source of truth
// for both the table and grid views so they can't drift out of sync again.
const STATUS_META: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active: { label: "Active", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  onboarding: { label: "Onboarding", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  on_leave: { label: "On Leave", bg: "bg-[#253C7D]/10", text: "text-[#1E3066]", dot: "bg-[#253C7D]" },
  suspended: { label: "Suspended", bg: "bg-rose-100", text: "text-rose-700", dot: "bg-rose-500" },
  inactive: { label: "Inactive", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
};
const getStatusMeta = (status: string) =>
  STATUS_META[status] || { label: status, bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  role: "",
  department: DEPARTMENTS[0],
  branch_id: "",
  status: "onboarding",
  join_date: new Date().toISOString().split("T")[0],
  reports_to: "",
};

export default function Employees() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const canManage = isAdmin || !!role?.employees_manage;
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterAccount, setFilterAccount] = useState("");
  const [sortField, setSortField] = useState<"first_name" | "last_name" | "email" | "role" | "department" | "branch" | "status" | "join_date" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState<{ id: number; name: string; color: string }[]>([]);
  const [accountStatus, setAccountStatus] = useState<Record<string, { invited: boolean; hasAccount: boolean }>>({});
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    employee: true,
    role: true,
    department: true,
    branch: true,
    status: true,
    account: true,
    joinDate: true,
    actions: true
  });
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const pageWindow = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  };

  const loadEmployees = () => {
    supabase.from("employees").select("*, branches(name)").is("deleted_at", null).order("first_name").then(({ data, error }) => {
      if (error) { toast("Error", "Failed to load employee directory", "error"); return; }
      setEmployees(data || []);
    });
  };

  useEffect(() => {
    loadEmployees();
    supabase.from("branches").select("id, name").order("name").then(({ data }) => setBranches(data || []));
    supabase.from("app_roles").select("id, name, color").order("name").then(({ data }) => setRoles(data || []));
  }, []);

  // Load account status for each employee
  useEffect(() => {
    const emails = employees.map((e) => e.email);
    if (emails.length === 0) return;
    supabase.rpc("get_user_account_status", { emails }).then(({ data }) => {
      if (data) {
        const statusMap: Record<string, { invited: boolean; hasAccount: boolean }> = {};
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

  const depts = Array.from(new Set(employees.map((e) => e.department)));
  const branchCount = new Set(employees.map((e) => e.branch_id).filter(Boolean)).size;
  // Reporting lines can point to any manager in the company. Include the
  // department in the option label so same-named managers are distinguishable.
  const managers = employees.filter((employee) => /\bmanager\b/i.test(employee.role || ""));

  // Dashboard statistics
  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === "active").length,
    onboarding: employees.filter(e => e.status === "onboarding").length,
    withAccounts: Object.values(accountStatus).filter(acc => acc.hasAccount).length,
    invited: Object.values(accountStatus).filter(acc => acc.invited && !acc.hasAccount).length,
    byDepartment: depts.reduce((acc, dept) => {
      acc[dept] = employees.filter(e => e.department === dept).length;
      return acc;
    }, {} as Record<string, number>)
  };

  const filtered = employees.filter((e) => {
    const matchesSearch = `${e.first_name} ${e.last_name} ${e.email} ${e.role}`.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !filterDept || e.department === filterDept;
    const matchesStatus = !filterStatus || e.status === filterStatus;
    const matchesBranch = !filterBranch || e.branch_id === filterBranch;
    const acc = accountStatus[e.email];
    const matchesAccount = !filterAccount || 
      (filterAccount === "has_account" && acc?.hasAccount) ||
      (filterAccount === "invited" && acc?.invited && !acc?.hasAccount) ||
      (filterAccount === "no_account" && !acc?.hasAccount && !acc?.invited);
    return matchesSearch && matchesDept && matchesStatus && matchesBranch && matchesAccount;
  }).sort((a, b) => {
    if (!sortField) return 0;
    const aValue = sortField === "branch" ? a.branches?.name : a[sortField];
    const bValue = sortField === "branch" ? b.branches?.name : b[sortField];
    const comparison = String(aValue || "").localeCompare(String(bValue || ""));
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const empTotalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const empSafePage = Math.min(page, empTotalPages);
  const empPageStart = filtered.length === 0 ? 0 : (empSafePage - 1) * pageSize + 1;
  const empPageEnd = Math.min(empSafePage * pageSize, filtered.length);
  const pagedEmployees = filtered.slice((empSafePage - 1) * pageSize, empSafePage * pageSize);

  // Table column widths — the desktop table used a flat `grid-cols-9` (nine
  // equal-width tracks), which starved the Employee column (avatar + name +
  // email, by far the widest cell) down to the same width as Status or
  // Actions, so its content overflowed into the next column. Widths are
  // driven from here so the header row and every data row always agree,
  // regardless of which optional columns are toggled on via the Columns menu.
  const COLUMN_WIDTHS: Record<string, string> = {
    employee: "minmax(230px,2.4fr)",
    role: "minmax(110px,1fr)",
    department: "minmax(110px,1fr)",
    branch: "minmax(130px,1.1fr)",
    status: "minmax(100px,0.85fr)",
    account: "minmax(100px,0.85fr)",
    joinDate: "minmax(95px,0.8fr)",
    actions: "minmax(85px,0.75fr)",
  };
  const tableColumns = [
    "employee",
    ...(visibleColumns.role ? ["role"] : []),
    ...(visibleColumns.department ? ["department"] : []),
    ...(visibleColumns.branch ? ["branch"] : []),
    ...(visibleColumns.status ? ["status"] : []),
    ...(visibleColumns.account ? ["account"] : []),
    ...(visibleColumns.joinDate ? ["joinDate"] : []),
    ...(visibleColumns.actions && canManage ? ["actions"] : []),
  ];
  // Tailwind's JIT compiler can't see a class string built from this
  // runtime value, so the template goes through a CSS variable referenced
  // by a static (non-interpolated) arbitrary-property class instead.
  const tableGridStyle = { "--emp-cols": tableColumns.map((c) => COLUMN_WIDTHS[c]).join(" ") } as React.CSSProperties;

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pagedEmployees.map(e => e.id)));
    }
    setSelectAll(!selectAll);
  }, [selectAll, pagedEmployees]);

  const handleSelectOne = useCallback((id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setSelectAll(newSelected.size === pagedEmployees.length);
  }, [selectedIds, pagedEmployees.length]);

  const bulkInvite = async () => {
    if (!canManage || selectedIds.size === 0) return;
    const selectedEmployees = employees.filter(e => selectedIds.has(e.id));
    let successCount = 0;
    
    for (const employee of selectedEmployees) {
      const acc = accountStatus[employee.email];
      if (acc?.hasAccount || acc?.invited) continue;
      
      try {
        const { error } = await supabase.functions.invoke("invite-user", {
          body: {
            email: employee.email,
            display_name: `${employee.first_name} ${employee.last_name}`,
            role_id: roles.find((r) => r.name === employee.role)?.id || null,
            redirect_to: `${import.meta.env.VITE_APP_URL.replace(/\/$/, "")}/reset-password`,
          },
        });
        if (!error) {
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
  };

  const bulkDelete = async () => {
    if (!canManage || selectedIds.size === 0) return;
    if (!confirm(`Move ${selectedIds.size} employee(s) to the Recycle Bin?`)) return;
    
    const selectedEmployees = employees.filter(e => selectedIds.has(e.id));
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
          description: `${employee.first_name} ${employee.last_name} moved to the Recycle Bin (bulk)` 
        });
      }
    }
    
    if (successCount > 0) {
      toast("Bulk delete completed", `${successCount} employee(s) moved to Recycle Bin`, "success");
      loadEmployees();
    }
    setSelectedIds(new Set());
    setSelectAll(false);
  };

  const exportToCSV = () => {
    const headers = ["First Name", "Last Name", "Email", "Phone", "Role", "Department", "Branch", "Status", "Join Date", "Account Status"];
    const rows = filtered.map(e => {
      const acc = accountStatus[e.email];
      const accountStatusValue = acc?.hasAccount ? "Active" : acc?.invited ? "Invited" : "No Account";
      return [
        e.first_name,
        e.last_name,
        e.email,
        e.phone || "",
        e.role || "",
        e.department || "",
        e.branches?.name || "Headquarters",
        e.status,
        e.join_date || "",
        accountStatusValue
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(",");
    });
    
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employees_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast("Export complete", `${filtered.length} employee(s) exported to CSV`, "success");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + F: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        (document.querySelector('input[type="text"]') as HTMLElement)?.focus();
      }
      // Escape: Clear selection
      if (e.key === 'Escape' && selectedIds.size > 0) {
        setSelectedIds(new Set());
        setSelectAll(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds.size]);

  useEffect(() => {
    if (page > empTotalPages) setPage(empTotalPages);
  }, [page, empTotalPages]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim() || !canManage) return;
    setSubmitting(true);
    const { data, error } = await supabase.from("employees").insert({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      role: form.role.trim() || null,
      department: form.department || null,
      branch_id: form.branch_id || null,
      status: form.status,
      join_date: form.join_date,
      reports_to: form.reports_to || null,
    }).select().single();
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
    notify({ source: "employees", type: "info", title: "New employee added", message: `${form.first_name} ${form.last_name} (${form.role || "no title"}) joined ${form.department || "the company"}.`, entityId: data.id });

    // Pre-provision user_role_assignments by email (so they can be invited)
    await supabase.from("user_role_assignments").upsert({
      email: form.email.trim(),
      display_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
      role_id: roles.find((r) => r.name === form.role.trim())?.id || null,
    }, { onConflict: "email" });

    setForm(emptyForm);
    setShowAddModal(false);
    loadEmployees();
  };

  const inviteUser = async (e: any) => {
    if (!canManage) return;
    setInvitingId(e.id);
    try {
      const { error } = await supabase.functions.invoke("invite-user", {
        body: {
          email: e.email,
          display_name: `${e.first_name} ${e.last_name}`,
          role_id: roles.find((r) => r.name === e.role)?.id || null,
          redirect_to: `${import.meta.env.VITE_APP_URL.replace(/\/$/, "")}/reset-password`,
        },
      });
      if (error) throw error;
      toast("Invitation sent", `An invite link was sent to ${e.email}`, "success");
      setAccountStatus((prev) => ({ ...prev, [e.email]: { invited: true, hasAccount: false } }));
    } catch (err: any) {
      toast("Invite failed", err.message || "Could not send invitation", "error");
    } finally {
      setInvitingId(null);
    }
  };

  const deleteEmployee = async (employee: any) => {
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
    logActivity({ module: "employees", action: "deleted", entityType: "employee", entityId: employee.id, actorName, actorRole: role?.name || "Unknown", description: `${name} moved to the Recycle Bin` });
    loadEmployees();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8 font-sans">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              <span>Workspace</span>
              <i className="ri-arrow-right-s-line text-xs" />
              <span className="text-[#253C7D] font-bold">Employee Directory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Employee Directory</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage your workforce across {branchCount} location{branchCount === 1 ? "" : "s"}</p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {canManage && (
              <button
                onClick={() => { setForm(emptyForm); setShowAddModal(true); }}
                className="inline-flex items-center gap-2 bg-[#253C7D] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1E3066] transition-all shadow-md shadow-[#253C7D]/20 cursor-pointer"
              >
                <i className="ri-user-add-line text-lg" />
                Add Employee
              </button>
            )}
            <Link to="/hire" className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all border border-gray-200/80 shadow-2xs cursor-pointer">
              <i className="ri-user-search-line text-lg" />
              Hire New
            </Link>
          </div>
        </div>

        {/* Dashboard Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-[#253C7D]/10 rounded-xl flex items-center justify-center">
                <i className="ri-team-line text-[#253C7D] text-lg" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <i className="ri-user-follow-line text-emerald-600 text-lg" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Onboarding</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.onboarding}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <i className="ri-user-add-line text-amber-600 text-lg" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Accounts</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.withAccounts}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-emerald-600 text-lg" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Invited</p>
                <p className="text-2xl font-bold text-[#253C7D] mt-1">{stats.invited}</p>
              </div>
              <div className="w-10 h-10 bg-[#253C7D]/10 rounded-xl flex items-center justify-center">
                <i className="ri-mail-send-line text-[#253C7D] text-lg" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Branches</p>
                <p className="text-2xl font-bold text-slate-700 mt-1">{branchCount}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <i className="ri-building-line text-slate-600 text-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Search employees by name, email, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${showFilters ? 'bg-[#253C7D]/10 text-[#1E3066]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <i className="ri-filter-3-line text-lg" />
                Filters
                {(filterDept || filterStatus || filterBranch || filterAccount) && (
                  <span className="w-2 h-2 bg-[#253C7D] rounded-full" />
                )}
              </button>
              <button
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all"
              >
                <i className="ri-layout-column-line text-lg" />
                Columns
              </button>
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "table" ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                >
                  <i className="ri-table-line text-lg" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "grid" ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                >
                  <i className="ri-grid-line text-lg" />
                </button>
              </div>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all"
              >
                <i className="ri-download-line text-lg" />
                Export
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent"
              >
                <option value="">All Departments</option>
                {depts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="onboarding">Onboarding</option>
                <option value="on_leave">On Leave</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <select
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent"
              >
                <option value="">All Account Statuses</option>
                <option value="has_account">Has Account</option>
                <option value="invited">Invited</option>
                <option value="no_account">No Account</option>
              </select>
            </div>
          )}

          {/* Column Menu */}
          {showColumnMenu && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-3">
                {Object.entries(visibleColumns).map(([key, visible]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={(e) => setVisibleColumns(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D]"
                    />
                    <span className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-[#253C7D] rounded-2xl px-6 py-4 mb-6 flex items-center justify-between shadow-lg shadow-[#253C7D]/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <i className="ri-user-follow-line text-white" />
              </div>
              <span className="text-white font-semibold">{selectedIds.size} employee{selectedIds.size === 1 ? '' : 's'} selected</span>
            </div>
            <div className="flex items-center gap-2">
              {canManage && (
                <>
                  <button
                    onClick={bulkInvite}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#253C7D] rounded-xl text-sm font-medium hover:bg-[#253C7D]/5 transition-colors"
                  >
                    <i className="ri-mail-send-line" />
                    Invite All
                  </button>
                  <button
                    onClick={bulkDelete}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors"
                  >
                    <i className="ri-delete-bin-line" />
                    Delete All
                  </button>
                </>
              )}
              <button
                onClick={() => { setSelectedIds(new Set()); setSelectAll(false); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/30 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Employee List */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
          {viewMode === "table" ? (
            <>
              {/* Table Header */}
              <div
                className="hidden md:grid md:[grid-template-columns:var(--emp-cols)] gap-x-3 bg-gray-50/80 px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100"
                style={tableGridStyle}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                  />
                  <span>Employee</span>
                </div>
                {visibleColumns.role && (
                  <button 
                    onClick={() => handleSort("role")}
                    className="flex items-center gap-2 hover:text-gray-700 cursor-pointer transition-colors"
                  >
                    Role
                    {sortField === "role" && <i className={`ri-arrow-${sortDirection === "asc" ? "up" : "down"}-s-line`} />}
                  </button>
                )}
                {visibleColumns.department && (
                  <button 
                    onClick={() => handleSort("department")}
                    className="flex items-center gap-2 hover:text-gray-700 cursor-pointer transition-colors"
                  >
                    Department
                    {sortField === "department" && <i className={`ri-arrow-${sortDirection === "asc" ? "up" : "down"}-s-line`} />}
                  </button>
                )}
                {visibleColumns.branch && (
                  <button 
                    onClick={() => handleSort("branch")}
                    className="flex items-center gap-2 hover:text-gray-700 cursor-pointer transition-colors"
                  >
                    Branch
                    {sortField === "branch" && <i className={`ri-arrow-${sortDirection === "asc" ? "up" : "down"}-s-line`} />}
                  </button>
                )}
                {visibleColumns.status && (
                  <button 
                    onClick={() => handleSort("status")}
                    className="flex items-center gap-2 hover:text-gray-700 cursor-pointer transition-colors"
                  >
                    Status
                    {sortField === "status" && <i className={`ri-arrow-${sortDirection === "asc" ? "up" : "down"}-s-line`} />}
                  </button>
                )}
                {visibleColumns.account && <span>Account</span>}
                {visibleColumns.joinDate && (
                  <button 
                    onClick={() => handleSort("join_date")}
                    className="flex items-center gap-2 hover:text-gray-700 cursor-pointer transition-colors"
                  >
                    Join Date
                    {sortField === "join_date" && <i className={`ri-arrow-${sortDirection === "asc" ? "up" : "down"}-s-line`} />}
                  </button>
                )}
                {visibleColumns.actions && canManage && <span className="text-right">Actions</span>}
              </div>

              {/* Table Rows */}
              {pagedEmployees.map((e) => {
                const acc = accountStatus[e.email];
                const isInvited = acc?.invited;
                const hasAccount = acc?.hasAccount;
                const isSelected = selectedIds.has(e.id);
                return (
                <Link
                  key={e.id}
                  to={`/employees/${e.id}`}
                  className={`grid grid-cols-1 md:[grid-template-columns:var(--emp-cols)] gap-x-3 px-6 py-4 border-b border-gray-50 items-center hover:bg-[#253C7D]/5 transition-colors cursor-pointer ${isSelected ? "bg-[#253C7D]/5 ring-1 ring-inset ring-[#253C7D]/40" : ""}`}
                  style={tableGridStyle}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <label
                      className="shrink-0 p-2 -m-2 flex items-center cursor-pointer"
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(e.id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                      />
                    </label>
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-[#253C7D] to-[#3B5998] flex items-center justify-center text-white text-sm font-bold shadow-md overflow-hidden">
                      {e.avatar_url ? (
                        <img src={e.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{e.first_name?.[0]}{e.last_name?.[0]}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{e.first_name} {e.last_name}</p>
                      <p className="text-xs text-gray-500 truncate">{e.email}</p>
                    </div>
                  </div>
                  {visibleColumns.role && <span className="text-sm text-gray-700 mt-2 md:mt-0 truncate">{e.role || "-"}</span>}
                  {visibleColumns.department && <span className="text-sm text-gray-600 mt-1 md:mt-0 truncate">{e.department || "-"}</span>}
                  {visibleColumns.branch && <span className="text-sm text-gray-600 mt-1 md:mt-0 truncate">{e.branches?.name || "Headquarters"}</span>}
                  {visibleColumns.status && (
                    <span className="mt-1 md:mt-0">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${getStatusMeta(e.status).bg} ${getStatusMeta(e.status).text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusMeta(e.status).dot}`} />
                        {getStatusMeta(e.status).label}
                      </span>
                    </span>
                  )}
                  {visibleColumns.account && (
                    <span className="mt-1 md:mt-0">
                      {hasAccount ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">
                          <i className="ri-checkbox-circle-line" />
                          Active
                        </span>
                      ) : isInvited ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-[#253C7D]/10 text-[#1E3066]">
                          <i className="ri-mail-send-line" />
                          Invited
                        </span>
                      ) : canManage ? (
                        <button
                          onClick={(ev) => { ev.preventDefault(); inviteUser(e); }}
                          disabled={invitingId === e.id}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-[#253C7D]/10 hover:text-[#1E3066] transition-colors cursor-pointer disabled:opacity-60"
                        >
                          <i className="ri-mail-line" />
                          {invitingId === e.id ? "Sending..." : "Invite"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">No account</span>
                      )}
                    </span>
                  )}
                  {visibleColumns.joinDate && <span className="text-sm text-gray-500 mt-1 md:mt-0">{e.join_date || "N/A"}</span>}
                  {visibleColumns.actions && canManage && (
                    <span className="mt-2 md:mt-0 text-left md:text-right">
                      <button
                        type="button"
                        onClick={(ev) => { ev.preventDefault(); deleteEmployee(e); }}
                        disabled={deletingId === e.id}
                        aria-label={`Delete ${e.first_name} ${e.last_name}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60 transition-colors"
                      >
                        <i className="ri-delete-bin-line" />
                        {deletingId === e.id ? "Removing..." : "Delete"}
                      </button>
                    </span>
                  )}
                </Link>
                );
              })}
            </>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {pagedEmployees.map((e) => {
                const acc = accountStatus[e.email];
                const isInvited = acc?.invited;
                const hasAccount = acc?.hasAccount;
                const isSelected = selectedIds.has(e.id);
                return (
                  <Link
                    key={e.id}
                    to={`/employees/${e.id}`}
                    className={`bg-white rounded-xl border border-gray-200/80 p-5 hover:shadow-xs hover:border-[#253C7D]/30 transition-all cursor-pointer ${isSelected ? "ring-2 ring-[#253C7D]" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <label
                          className="p-2 -m-2 flex items-center cursor-pointer"
                          onClick={(ev) => ev.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(e.id)}
                            className="w-4 h-4 rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                          />
                        </label>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#253C7D] to-[#3B5998] flex items-center justify-center text-white text-lg font-bold shadow-md overflow-hidden">
                          {e.avatar_url ? (
                            <img src={e.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>{e.first_name?.[0]}{e.last_name?.[0]}</span>
                          )}
                        </div>
                      </div>
                      {visibleColumns.status && (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${getStatusMeta(e.status).bg} ${getStatusMeta(e.status).text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusMeta(e.status).dot}`} />
                          {getStatusMeta(e.status).label}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">{e.first_name} {e.last_name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{e.email}</p>
                    <div className="space-y-2">
                      {visibleColumns.role && e.role && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <i className="ri-briefcase-line text-gray-400" />
                          {e.role}
                        </div>
                      )}
                      {visibleColumns.department && e.department && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <i className="ri-building-line text-gray-400" />
                          {e.department}
                        </div>
                      )}
                      {visibleColumns.branch && e.branches?.name && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <i className="ri-map-pin-line text-gray-400" />
                          {e.branches.name}
                        </div>
                      )}
                    </div>
                    {visibleColumns.account && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        {hasAccount ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <i className="ri-checkbox-circle-line" />
                            Active Account
                          </span>
                        ) : isInvited ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#253C7D]">
                            <i className="ri-mail-send-line" />
                            Invited
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">No Account</span>
                        )}
                        {canManage && (
                          <button
                            type="button"
                            onClick={(ev) => { ev.preventDefault(); deleteEmployee(e); }}
                            disabled={deletingId === e.id}
                            className="text-xs text-rose-600 hover:text-rose-700 disabled:opacity-60"
                          >
                            <i className="ri-delete-bin-line" />
                          </button>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-team-line text-3xl text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">No employees found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 mt-6 bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{empPageStart}</span>–<span className="font-semibold text-gray-900">{empPageEnd}</span> of <span className="font-semibold text-gray-900">{filtered.length}</span> employees
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Per page</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent cursor-pointer"
              >
                {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={empSafePage === 1}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <i className="ri-arrow-left-s-line text-lg" />
            </button>
            {pageWindow(empSafePage, empTotalPages).map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="w-10 h-10 flex items-center justify-center text-sm text-gray-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-all cursor-pointer ${p === empSafePage ? "bg-[#253C7D] text-white shadow-md shadow-[#253C7D]/20" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(empTotalPages, p + 1))}
              disabled={empSafePage === empTotalPages}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <i className="ri-arrow-right-s-line text-lg" />
            </button>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Employee</h2>
                <p className="text-sm text-gray-500 mt-1">Add staff who already work here directly into the directory</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                <i className="ri-close-line text-gray-500 text-xl" />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                  <input type="text" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent" placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                  <input type="text" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent" placeholder="Doe" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent" placeholder="john@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent" placeholder="+1 (555) 000-0000" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title / Role</label>
                  <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g., Software Engineer" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                  <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent bg-white cursor-pointer">
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
                  <select value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent bg-white cursor-pointer">
                    <option value="">Headquarters / Unassigned</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reports To</label>
                  <select value={form.reports_to} onChange={(e) => setForm({ ...form, reports_to: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent bg-white cursor-pointer">
                    <option value="">No manager</option>
                    {managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.first_name} {manager.last_name} — {manager.department || "No department"}</option>)}
                  </select>
                  {managers.length === 0 && (
                    <p className="mt-2 text-xs text-gray-400">No managers are available in the directory.</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent bg-white cursor-pointer">
                    <option value="onboarding">Onboarding</option>
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Join Date</label>
                  <input type="date" value={form.join_date} onChange={(e) => setForm({ ...form, join_date: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-[#253C7D] text-white text-sm font-semibold rounded-xl hover:bg-[#1E3066] transition-colors disabled:opacity-60 cursor-pointer shadow-lg shadow-[#253C7D]/20">
                  {submitting ? "Adding..." : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
