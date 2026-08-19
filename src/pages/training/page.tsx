import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "@/components/Toast";
import { notify } from "@/lib/notify";


interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string;
  duration_hours: number | null;
  instructor: string | null;
  format: "online" | "in_person" | "hybrid" | "self_paced";
  status: "active" | "draft" | "archived";
  created_at: string;
}

interface Enrollment {
  id: string;
  course_id: string;
  employee_id: string;
  status: "enrolled" | "in_progress" | "completed" | "failed" | "dropped";
  progress: number;
  score: number | null;
  enrolled_at: string;
  due_date: string | null;
  completed_at: string | null;
  certificate_issued: boolean;
  notes: string | null;
  employees?: { id: string; first_name: string; last_name: string; department: string; avatar_url: string | null };
  training_courses?: Course;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  avatar_url: string | null;
}

const FORMAT_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  online:     { label: "Online",      color: "bg-sky-100 text-sky-700",      icon: "ri-global-line" },
  in_person:  { label: "In Person",   color: "bg-emerald-100 text-emerald-700", icon: "ri-building-3-line" },
  hybrid:     { label: "Hybrid",      color: "bg-violet-100 text-violet-700", icon: "ri-link-m" },
  self_paced: { label: "Self-Paced",  color: "bg-amber-100 text-amber-700",   icon: "ri-time-line" },
};

const ENROLL_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  enrolled:    { label: "Enrolled",    color: "bg-sky-100 text-sky-700" },
  in_progress: { label: "In Progress", color: "bg-amber-100 text-amber-700" },
  completed:   { label: "Completed",   color: "bg-emerald-100 text-emerald-700" },
  failed:      { label: "Failed",      color: "bg-red-100 text-red-600" },
  dropped:     { label: "Dropped",     color: "bg-gray-100 text-gray-500" },
};

export default function TrainingPage() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role, isAdmin } = usePermissions();
  // Managing the course catalog and enrollments is a management action —
  // individual-contributor roles (Employee, Staff) only consume training.
  const canManage = isAdmin || (!!role && !["Employee", "Staff"].includes(role.name));
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"courses" | "enrollments" | "certificates">("courses");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollCourseId, setEnrollCourseId] = useState<string | null>(null);
  const [enrollEmployeeIds, setEnrollEmployeeIds] = useState<string[]>([]);
  const [enrollDueDate, setEnrollDueDate] = useState("");
  const [enrollSearch, setEnrollSearch] = useState("");
  const [enrollOpen, setEnrollOpen] = useState(false);
  const enrollRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const pageWindow = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  };

  const [newCourse, setNewCourse] = useState({
    title: "", description: "", category: "General", duration_hours: "", instructor: "", format: "online", status: "active",
  });
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Close the enroll dropdown when clicking outside.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (enrollRef.current && !enrollRef.current.contains(e.target as Node)) setEnrollOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Reset dropdown state when the modal closes.
  useEffect(() => {
    if (!showEnrollModal) {
      setEnrollOpen(false);
      setEnrollSearch("");
    }
  }, [showEnrollModal]);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [cRes, eRes, empRes] = await Promise.all([
      supabase.from("training_courses").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("training_enrollments").select("*, employees(id, first_name, last_name, department, avatar_url), training_courses(*)").is("deleted_at", null).order("enrolled_at", { ascending: false }),
      supabase.from("employees").select("id, first_name, last_name, email, department, avatar_url").eq("status", "active").is("deleted_at", null).order("first_name"),
    ]);
    if (cRes.data) setCourses(cRes.data);
    if (eRes.data) setEnrollments(eRes.data as Enrollment[]);
    if (empRes.data) setEmployees(empRes.data);
    setLoading(false);
  }

  const categories = [...new Set(courses.map((c) => c.category))];

  const filteredCourses = courses.filter((c) => {
    if (filterCategory && c.category !== filterCategory) return false;
    if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredEnrollments = enrollments.filter((e) => {
    if (filterStatus && e.status !== filterStatus) return false;
    if (searchQuery) {
      const emp = e.employees;
      const name = emp ? `${emp.first_name} ${emp.last_name}`.toLowerCase() : "";
      const course = e.training_courses?.title.toLowerCase() || "";
      if (!name.includes(searchQuery.toLowerCase()) && !course.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });
  const selectedEnrollmentEmployees = employees.filter((employee) => enrollEmployeeIds.includes(employee.id));

  const enrollTotalPages = Math.max(1, Math.ceil(filteredEnrollments.length / pageSize));
  const enrollSafePage = Math.min(page, enrollTotalPages);
  const enrollPageStart = filteredEnrollments.length === 0 ? 0 : (enrollSafePage - 1) * pageSize + 1;
  const enrollPageEnd = Math.min(enrollSafePage * pageSize, filteredEnrollments.length);
  const pagedEnrollments = filteredEnrollments.slice((enrollSafePage - 1) * pageSize, enrollSafePage * pageSize);

  useEffect(() => {
    if (page > enrollTotalPages) setPage(enrollTotalPages);
  }, [page, enrollTotalPages]);

  const certificates = enrollments.filter((e) => e.certificate_issued && e.status === "completed");

  const totalEnrolled = enrollments.filter((e) => e.status === "enrolled" || e.status === "in_progress").length;
  const totalCompleted = enrollments.filter((e) => e.status === "completed").length;
  const totalCerts = enrollments.filter((e) => e.certificate_issued).length;
  const avgProgress = enrollments.length > 0 ? Math.round(enrollments.reduce((a, e) => a + e.progress, 0) / enrollments.length) : 0;

  async function saveCourse() {
    if (!newCourse.title.trim() || !canManage) return;
    setSaving(true);
    const payload = {
      title: newCourse.title.trim(),
      description: newCourse.description || null,
      category: newCourse.category,
      duration_hours: newCourse.duration_hours ? parseFloat(newCourse.duration_hours) : null,
      instructor: newCourse.instructor || null,
      format: newCourse.format,
      status: newCourse.status,
    };
    const { error } = editingCourseId
      ? await supabase.from("training_courses").update(payload).eq("id", editingCourseId)
      : await supabase.from("training_courses").insert(payload);
    setSaving(false);
    if (error) { toast("Error", "Failed to save course", "error"); return; }
    setShowCourseModal(false);
    setEditingCourseId(null);
    setNewCourse({ title: "", description: "", category: "General", duration_hours: "", instructor: "", format: "online", status: "active" });
    fetchData();
  }

  function openEditCourse(course: Course) {
    if (!canManage) return;
    setNewCourse({
      title: course.title,
      description: course.description || "",
      category: course.category,
      duration_hours: course.duration_hours != null ? String(course.duration_hours) : "",
      instructor: course.instructor || "",
      format: course.format,
      status: course.status,
    });
    setEditingCourseId(course.id);
    setSelectedCourse(null);
    setShowCourseModal(true);
  }

  async function deleteCourse(course: Course) {
    if (!canManage) return;
    if (!confirm(`Delete "${course.title}"? It will be moved to the Recycle Bin and can be restored later.`)) return;
    const { error } = await supabase
      .from("training_courses")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", course.id);
    if (error) { toast("Error", "Failed to delete course", "error"); return; }
    setSelectedCourse(null);
    fetchData();
  }

  async function deleteEnrollment(enrollment: Enrollment) {
    if (!canManage) return;
    if (!confirm("Remove this enrollment record? It will be moved to the Recycle Bin and can be restored later.")) return;
    const { error } = await supabase
      .from("training_enrollments")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", enrollment.id);
    if (error) { toast("Error", "Failed to remove enrollment", "error"); return; }
    fetchData();
  }

  async function saveEnrollment() {
    if (!enrollCourseId || enrollEmployeeIds.length === 0) return;
    setSaving(true);
    const payload = enrollEmployeeIds.map((empId) => ({
      course_id: enrollCourseId,
      employee_id: empId,
      due_date: enrollDueDate || null,
      status: "enrolled",
      progress: 0,
    }));
    const { error } = await supabase.from("training_enrollments").insert(payload);
    setSaving(false);
    if (error) { toast("Error", "Failed to enroll employees", "error"); return; }

    const course = courses.find((item) => item.id === enrollCourseId);
    const enrolledEmployees = employees.filter((employee) => enrollEmployeeIds.includes(employee.id));
    const emails = enrolledEmployees.map((employee) => employee.email).filter(Boolean);
    const { data: assignments } = emails.length > 0
      ? await supabase.from("user_role_assignments").select("email, user_id").in("email", emails).is("deleted_at", null)
      : { data: [] };
    const userIdsByEmail = new Map((assignments || [])
      .filter((assignment: any) => assignment.user_id)
      .map((assignment: any) => [assignment.email.toLowerCase(), assignment.user_id]));

    // Send a personal notification only to employees who already have an
    // account; a null recipient would make the notification company-wide.
    await Promise.all(enrolledEmployees.map((employee) => {
      const recipientUserId = userIdsByEmail.get(employee.email.toLowerCase());
      if (!recipientUserId) return Promise.resolve();
      return notify({
        source: "training",
        type: "info",
        title: "Training assigned",
        message: `You have been enrolled in ${course?.title || "a training course"}${enrollDueDate ? `. Complete it by ${new Date(`${enrollDueDate}T00:00:00`).toLocaleDateString()}.` : "."}`,
        entityId: enrollCourseId,
        recipientUserId,
      });
    }));

    toast("Success", `${enrollEmployeeIds.length} employee${enrollEmployeeIds.length === 1 ? '' : 's'} enrolled.`, "success");
    setShowEnrollModal(false);
    setEnrollCourseId(null);
    setEnrollEmployeeIds([]);
    setEnrollDueDate("");
    setEnrollSearch("");
    fetchData();
  }

  async function issueCertificate(enrollmentId: string) {
    if (!canManage) return;
    const { error } = await supabase.from("training_enrollments").update({ certificate_issued: true }).eq("id", enrollmentId);
    if (error) { toast("Error", "Failed to issue certificate", "error"); return; }
    fetchData();
  }

  return (
    <div className="training-hub min-h-screen bg-[#F8F8F6] p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Employee Training
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Assign courses, track progress, and issue completion certificates</p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowEnrollModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#253C7D] border border-[#253C7D] rounded-lg hover:bg-[#253C7D]/5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-user-add-line" />
              Enroll Employee
            </button>
            <button
              onClick={() => { setNewCourse({ title: "", description: "", category: "General", duration_hours: "", instructor: "", format: "online", status: "active" }); setEditingCourseId(null); setShowCourseModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#253C7D] text-white text-sm font-medium rounded-lg hover:bg-[#1F336A] transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line" />
              Add Course
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Courses", value: courses.filter((c) => c.status === "active").length, icon: "ri-book-open-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
          { label: "Active Enrollments", value: totalEnrolled, icon: "ri-user-star-line", color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Completions", value: totalCompleted, icon: "ri-award-line", color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Certificates Issued", value: totalCerts, icon: "ri-medal-line", color: "text-violet-600", bg: "bg-violet-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-lg flex items-center justify-center`}>
                <i className={`${s.icon} text-lg`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit max-w-full overflow-x-auto">
        {(["courses", "enrollments", "certificates"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${activeTab === t ? "bg-white text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t === "courses" ? "Courses" : t === "enrollments" ? "Enrollments" : "Certificates"}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder={activeTab === "courses" ? "Search courses..." : "Search employee or course..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D]"
          />
        </div>
        {activeTab === "courses" && (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {activeTab === "enrollments" && (
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="">All Statuses</option>
            {Object.entries(ENROLL_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        )}
      </div>

      {/* Courses Grid */}
      {activeTab === "courses" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12 text-gray-400 text-sm">Loading courses...</div>
          ) : filteredCourses.map((course) => {
            const courseEnrollments = enrollments.filter((e) => e.course_id === course.id);
            const completed = courseEnrollments.filter((e) => e.status === "completed").length;
            const fmt = FORMAT_CONFIG[course.format];
            return (
              <div
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className="bg-white rounded-xl border border-gray-100 p-5 cursor-pointer hover:border-[#253C7D]/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{course.category}</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${fmt.color}`}>
                    <i className={fmt.icon} />{fmt.label}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{course.title}</h3>
                <p className="text-xs text-gray-400 line-clamp-2 mb-4">{course.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1"><i className="ri-user-line" /> {courseEnrollments.length} enrolled</span>
                  <span className="flex items-center gap-1"><i className="ri-checkbox-circle-line text-emerald-500" /> {completed} done</span>
                  {course.duration_hours != null && <span className="flex items-center gap-1"><i className="ri-time-line" /> {course.duration_hours}h</span>}
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Completion rate</span>
                    <span>{courseEnrollments.length > 0 ? Math.round((completed / courseEnrollments.length) * 100) : 0}%</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-[#253C7D] h-1.5 rounded-full"
                      style={{ width: `${courseEnrollments.length > 0 ? Math.round((completed / courseEnrollments.length) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enrollments Table */}
      {activeTab === "enrollments" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Employee</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Course</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Progress</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Score</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Due Date</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Certificate</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {pagedEnrollments.map((e) => {
                const cfg = ENROLL_STATUS_CONFIG[e.status];
                const emp = e.employees;
                const overdue = e.due_date && !e.completed_at && new Date(e.due_date) < new Date();
                return (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {emp?.avatar_url ? (
                          <img src={emp.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-xs font-semibold">
                            {emp ? emp.first_name[0] + emp.last_name[0] : "?"}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-800">{emp ? `${emp.first_name} ${emp.last_name}` : "—"}</p>
                          <p className="text-xs text-gray-400">{emp?.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-gray-700 max-w-[200px] truncate">{e.training_courses?.title}</p>
                      <p className="text-xs text-gray-400">{e.training_courses?.category}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 w-28">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${e.progress === 100 ? "bg-emerald-500" : "bg-[#253C7D]"}`} style={{ width: `${e.progress}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">{e.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {e.score != null ? `${e.score}%` : "—"}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      {e.due_date ? (
                        <span className={overdue ? "text-red-500 font-medium" : "text-gray-600"}>
                          {new Date(e.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {overdue && <span className="ml-1 text-xs">⚠</span>}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      {e.certificate_issued ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <i className="ri-medal-line" /> Issued
                        </span>
                      ) : e.status === "completed" && canManage ? (
                        <button
                          onClick={() => issueCertificate(e.id)}
                          className="text-xs text-[#253C7D] hover:underline cursor-pointer whitespace-nowrap"
                        >
                          Issue Certificate
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {canManage && (
                        <button
                          onClick={() => deleteEnrollment(e)}
                          className="text-xs text-red-500 hover:underline cursor-pointer whitespace-nowrap"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredEnrollments.length === 0 && (
            <div className="p-12 text-center text-gray-400 text-sm">No enrollments match your filters.</div>
          )}
          {filteredEnrollments.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-[11px] text-gray-500">
                  Showing <span className="font-semibold text-gray-700">{enrollPageStart}</span>–<span className="font-semibold text-gray-700">{enrollPageEnd}</span> of <span className="font-semibold text-gray-700">{filteredEnrollments.length}</span> enrollments
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-400">Rows per page</span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="px-2 py-1 border border-gray-200 rounded-lg text-[11px] bg-white text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={enrollSafePage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <i className="ri-arrow-left-s-line" />
                </button>
                {pageWindow(enrollSafePage, enrollTotalPages).map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-[11px] text-gray-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${p === enrollSafePage ? "bg-[#253C7D] text-white" : "text-gray-600 hover:bg-gray-100"}`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => setPage((p) => Math.min(enrollTotalPages, p + 1))}
                  disabled={enrollSafePage === enrollTotalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <i className="ri-arrow-right-s-line" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Certificates */}
      {activeTab === "certificates" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400 text-sm">No certificates issued yet.</div>
          )}
          {certificates.map((e) => {
            const emp = e.employees;
            return (
              <div key={e.id} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                    <i className="ri-medal-line text-xl" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{emp ? `${emp.first_name} ${emp.last_name}` : "—"}</p>
                    <p className="text-xs text-gray-400">{emp?.department}</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">{e.training_courses?.title}</p>
                <p className="text-xs text-gray-400 mb-3">{e.training_courses?.category} • {e.training_courses?.duration_hours}h</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Completed {e.completed_at ? new Date(e.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
                  {e.score != null && <span className="font-semibold text-emerald-600">Score: {e.score}%</span>}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
                    <i className="ri-verified-badge-line" /> Certificate Issued
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Course Detail Panel */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setSelectedCourse(null)} />
          <div className="relative w-full sm:w-[460px] bg-white h-full overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{selectedCourse.category}</span>
                <h3 className="text-base font-semibold text-gray-900 mt-2">{selectedCourse.title}</h3>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {canManage && (
                  <>
                    <button onClick={() => openEditCourse(selectedCourse)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer" title="Edit course">
                      <i className="ri-edit-line text-gray-500" />
                    </button>
                    <button onClick={() => deleteCourse(selectedCourse)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 cursor-pointer" title="Delete course">
                      <i className="ri-delete-bin-line text-gray-500 hover:text-red-600" />
                    </button>
                  </>
                )}
                <button onClick={() => setSelectedCourse(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer">
                  <i className="ri-close-line text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm text-gray-600">{selectedCourse.description}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Format", value: FORMAT_CONFIG[selectedCourse.format]?.label },
                  { label: "Duration", value: selectedCourse.duration_hours ? `${selectedCourse.duration_hours}h` : "—" },
                  { label: "Instructor", value: selectedCourse.instructor || "—" },
                  { label: "Status", value: selectedCourse.status },
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                    <p className="text-sm font-medium text-gray-800">{item.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Enrolled Employees</p>
                <div className="space-y-2">
                  {enrollments.filter((e) => e.course_id === selectedCourse.id).map((e) => {
                    const emp = e.employees;
                    const cfg = ENROLL_STATUS_CONFIG[e.status];
                    return (
                      <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {emp?.avatar_url ? (
                            <img src={emp.avatar_url} alt="" className="w-7 h-7 rounded-lg object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-xs font-semibold">
                              {emp ? emp.first_name[0] + emp.last_name[0] : "?"}
                            </div>
                          )}
                          <span className="text-sm text-gray-700">{emp ? `${emp.first_name} ${emp.last_name}` : "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{e.progress}%</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                        </div>
                      </div>
                    );
                  })}
                  {enrollments.filter((e) => e.course_id === selectedCourse.id).length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-3">No enrollments yet.</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => { setEnrollCourseId(selectedCourse.id); setShowEnrollModal(true); setSelectedCourse(null); }}
                className="w-full py-2 text-sm font-medium text-[#253C7D] border border-[#253C7D] rounded-lg hover:bg-[#253C7D]/5 cursor-pointer whitespace-nowrap"
              >
                Enroll an Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setShowCourseModal(false); setEditingCourseId(null); }} />
          <div className="relative bg-white rounded-2xl w-full max-w-[540px] max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">{editingCourseId ? "Edit Training Course" : "Add Training Course"}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Course Title *</label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D]"
                  placeholder="e.g. Advanced Leadership Program"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Category</label>
                  <input
                    type="text"
                    value={newCourse.category}
                    onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D]"
                    placeholder="e.g. Leadership"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Duration (hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newCourse.duration_hours}
                    onChange={(e) => setNewCourse({ ...newCourse, duration_hours: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Instructor</label>
                  <input
                    type="text"
                    value={newCourse.instructor}
                    onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Format</label>
                  <select
                    value={newCourse.format}
                    onChange={(e) => setNewCourse({ ...newCourse, format: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    {Object.entries(FORMAT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              {editingCourseId && (
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
                  <select
                    value={newCourse.status}
                    onChange={(e) => setNewCourse({ ...newCourse, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setShowCourseModal(false); setEditingCourseId(null); }} className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap">Cancel</button>
              <button
                onClick={saveCourse}
                disabled={saving || !newCourse.title.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#253C7D] rounded-lg hover:bg-[#1F336A] disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {saving ? "Saving..." : editingCourseId ? "Save Changes" : "Create Course"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Employee Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowEnrollModal(false)} />
          <div className="relative w-full max-w-[560px] overflow-visible rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Enroll employees</h3>
                <p className="mt-1 text-xs text-gray-500">Assign a course and notify the selected employees.</p>
              </div>
              <button onClick={() => setShowEnrollModal(false)} className="-mr-2 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Close enrollment form"><i className="ri-close-line text-lg" /></button>
            </div>
            <div className="max-h-[65vh] space-y-5 overflow-y-auto px-6 py-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">Course <span className="text-red-500">*</span></label>
                <select
                  value={enrollCourseId || ""}
                  onChange={(e) => setEnrollCourseId(e.target.value || null)}
                  className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-medium text-gray-800 focus:border-[#253C7D] focus:outline-none focus:ring-2 focus:ring-[#253C7D]/10"
                >
                  <option value="">Select course...</option>
                  {courses.filter((c) => c.status === "active").map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between"><label className="block text-xs font-semibold text-gray-700">Employees <span className="text-red-500">*</span></label><span className="text-[11px] font-medium text-[#253C7D]">{enrollEmployeeIds.length} selected</span></div>
                <div className="relative" ref={enrollRef}>
                  <div className="relative">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                    <input
                      type="text"
                      role="combobox"
                      aria-expanded={enrollOpen}
                      value={enrollOpen ? enrollSearch : enrollEmployeeIds.length > 0 ? `${enrollEmployeeIds.length} employee${enrollEmployeeIds.length === 1 ? '' : 's'} selected` : enrollSearch}
                      onChange={(e) => {
                        setEnrollSearch(e.target.value);
                        setEnrollOpen(true);
                      }}
                      onFocus={() => setEnrollOpen(true)}
                      placeholder="Search by name, department..."
                      className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#253C7D] focus:outline-none focus:ring-2 focus:ring-[#253C7D]/10"
                    />
                    <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  {enrollOpen && (
                    <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                      {(() => {
                        const filtered = employees.filter((emp) => {
                          const q = enrollSearch.trim().toLowerCase();
                          if (!q) return true;
                          return `${emp.first_name} ${emp.last_name} ${emp.department}`.toLowerCase().includes(q);
                        });
                        return (
                          <>
                            <p className="border-b border-gray-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{filtered.length} available employee{filtered.length === 1 ? '' : 's'}</p>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                const allIds = filtered.map((e) => e.id);
                                const allSelected = allIds.length > 0 && allIds.every((id) => enrollEmployeeIds.includes(id));
                                setEnrollEmployeeIds(allSelected ? [] : allIds);
                              }}
                              className="flex w-full items-center gap-3 border-b border-gray-100 bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                            >
                              <span className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                filtered.length > 0 && filtered.every((e) => enrollEmployeeIds.includes(e.id))
                                  ? "bg-[#253C7D] border-[#253C7D]"
                                  : filtered.some((e) => enrollEmployeeIds.includes(e.id))
                                    ? "bg-[#253C7D]/20 border-[#253C7D]"
                                    : "border-gray-300 bg-white"
                              }`}>
                                {filtered.length > 0 && filtered.every((e) => enrollEmployeeIds.includes(e.id)) && <i className="ri-check-line text-white text-xs" />}
                                {filtered.some((e) => enrollEmployeeIds.includes(e.id)) && !(filtered.length > 0 && filtered.every((e) => enrollEmployeeIds.includes(e.id))) && <span className="w-2 h-0.5 bg-[#253C7D] rounded" />}
                              </span>
                              Select all ({filtered.length})
                            </button>
                            <div className="max-h-52 overflow-y-auto py-1">{filtered.length === 0 ? (
                              <p className="px-3 py-4 text-[12px] text-gray-400">No employees match your search.</p>
                            ) : (
                              filtered.map((emp) => {
                                const checked = enrollEmployeeIds.includes(emp.id);
                                return (
                                  <label
                                    key={emp.id}
                                    onMouseDown={(e) => e.preventDefault()}
                                    className={`mx-1 flex w-[calc(100%-8px)] items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors ${checked ? "bg-[#253C7D]/10" : "hover:bg-gray-50"}`}
                                  >
                                    <span className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                      checked ? "bg-[#253C7D] border-[#253C7D]" : "border-gray-300 bg-white"
                                    }`}>
                                      {checked && <i className="ri-check-line text-white text-xs" />}
                                    </span>
                                    <input type="checkbox" className="sr-only" checked={checked} onChange={() => {
                                      setEnrollEmployeeIds((prev) =>
                                        prev.includes(emp.id) ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
                                      );
                                    }} />
                                    <span className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden">
                                      {emp.avatar_url ? (
                                        <img src={emp.avatar_url} alt="" className="w-7 h-7 object-cover" />
                                      ) : (
                                        `${emp.first_name[0] || ''}${emp.last_name[0] || ''}`.toUpperCase()
                                      )}
                                    </span>
                                    <span className="flex-1 min-w-0">
                                      <span className="block text-[13px] font-medium text-gray-900">{emp.first_name} {emp.last_name}</span>
                                      <span className="block text-[11px] text-gray-400 truncate">{emp.department}</span>
                                    </span>
                                    {checked && <i className="ri-check-line text-[#253C7D] text-sm shrink-0" />}
                                  </label>
                                );
                              })
                            )}</div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
                {selectedEnrollmentEmployees.length > 0 && (
                  <div className="mt-3 rounded-xl border border-[#253C7D]/10 bg-[#253C7D]/5 p-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#253C7D]">Selected employees</p>
                    <div className="flex flex-wrap gap-1.5">{selectedEnrollmentEmployees.slice(0, 4).map((employee) => <span key={employee.id} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-medium text-gray-700 shadow-sm">{employee.first_name} {employee.last_name}<button type="button" onClick={() => setEnrollEmployeeIds((ids) => ids.filter((id) => id !== employee.id))} className="text-gray-400 hover:text-red-500" aria-label={`Remove ${employee.first_name} ${employee.last_name}`}><i className="ri-close-line" /></button></span>)}{selectedEnrollmentEmployees.length > 4 && <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-gray-500">+{selectedEnrollmentEmployees.length - 4} more</span>}</div>
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">Due date <span className="font-normal text-gray-400">(optional)</span></label>
                <input
                  type="date"
                  value={enrollDueDate}
                  onChange={(e) => setEnrollDueDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-800 focus:border-[#253C7D] focus:outline-none focus:ring-2 focus:ring-[#253C7D]/10"
                />
              </div>
            </div>
            <div className="flex gap-3 border-t border-gray-100 bg-gray-50/70 px-6 py-4">
              <button onClick={() => setShowEnrollModal(false)} className="flex-1 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={saveEnrollment}
                disabled={saving || !enrollCourseId || enrollEmployeeIds.length === 0}
                className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#253C7D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1F336A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className="ri-user-add-line" />
                {saving ? "Enrolling..." : `Enroll${enrollEmployeeIds.length > 1 ? ` (${enrollEmployeeIds.length})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
