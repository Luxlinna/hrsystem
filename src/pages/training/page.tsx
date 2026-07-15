import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Course {
  id: number;
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
  id: number;
  course_id: number;
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
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"courses" | "enrollments" | "certificates">("courses");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollCourseId, setEnrollCourseId] = useState<number | null>(null);
  const [enrollEmployeeId, setEnrollEmployeeId] = useState("");
  const [enrollDueDate, setEnrollDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [newCourse, setNewCourse] = useState({
    title: "", description: "", category: "General", duration_hours: "", instructor: "", format: "online", status: "active",
  });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [cRes, eRes, empRes] = await Promise.all([
      supabase.from("training_courses").select("*").order("created_at", { ascending: false }),
      supabase.from("training_enrollments").select("*, employees(id, first_name, last_name, department, avatar_url), training_courses(*)").order("enrolled_at", { ascending: false }),
      supabase.from("employees").select("id, first_name, last_name, department, avatar_url").eq("status", "active").order("first_name"),
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

  const certificates = enrollments.filter((e) => e.certificate_issued && e.status === "completed");

  const totalEnrolled = enrollments.filter((e) => e.status === "enrolled" || e.status === "in_progress").length;
  const totalCompleted = enrollments.filter((e) => e.status === "completed").length;
  const totalCerts = enrollments.filter((e) => e.certificate_issued).length;
  const avgProgress = enrollments.length > 0 ? Math.round(enrollments.reduce((a, e) => a + e.progress, 0) / enrollments.length) : 0;

  async function saveCourse() {
    if (!newCourse.title.trim()) return;
    setSaving(true);
    await supabase.from("training_courses").insert({
      title: newCourse.title.trim(),
      description: newCourse.description || null,
      category: newCourse.category,
      duration_hours: newCourse.duration_hours ? parseFloat(newCourse.duration_hours) : null,
      instructor: newCourse.instructor || null,
      format: newCourse.format,
      status: newCourse.status,
    });
    setSaving(false);
    setShowCourseModal(false);
    setNewCourse({ title: "", description: "", category: "General", duration_hours: "", instructor: "", format: "online", status: "active" });
    fetchData();
  }

  async function saveEnrollment() {
    if (!enrollCourseId || !enrollEmployeeId) return;
    setSaving(true);
    await supabase.from("training_enrollments").insert({
      course_id: enrollCourseId,
      employee_id: enrollEmployeeId,
      due_date: enrollDueDate || null,
      status: "enrolled",
      progress: 0,
    });
    setSaving(false);
    setShowEnrollModal(false);
    setEnrollCourseId(null);
    setEnrollEmployeeId("");
    setEnrollDueDate("");
    fetchData();
  }

  async function issueCertificate(enrollmentId: number) {
    await supabase.from("training_enrollments").update({ certificate_issued: true }).eq("id", enrollmentId);
    fetchData();
  }

  return (
    <div className="min-h-screen bg-[#F8F8F6] p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Employee Training
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Assign courses, track progress, and issue completion certificates</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEnrollModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0D7377] border border-[#0D7377] rounded-lg hover:bg-[#0D7377]/5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-user-add-line" />
            Enroll Employee
          </button>
          <button
            onClick={() => setShowCourseModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0D7377] text-white text-sm font-medium rounded-lg hover:bg-[#0a5f62] transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line" />
            Add Course
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Courses", value: courses.filter((c) => c.status === "active").length, icon: "ri-book-open-line", color: "text-[#0D7377]", bg: "bg-[#0D7377]/10" },
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
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
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
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder={activeTab === "courses" ? "Search courses..." : "Search employee or course..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377]"
          />
        </div>
        {activeTab === "courses" && (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377] cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {activeTab === "enrollments" && (
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377] cursor-pointer"
          >
            <option value="">All Statuses</option>
            {Object.entries(ENROLL_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        )}
      </div>

      {/* Courses Grid */}
      {activeTab === "courses" && (
        <div className="grid grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 text-center py-12 text-gray-400 text-sm">Loading courses...</div>
          ) : filteredCourses.map((course) => {
            const courseEnrollments = enrollments.filter((e) => e.course_id === course.id);
            const completed = courseEnrollments.filter((e) => e.status === "completed").length;
            const fmt = FORMAT_CONFIG[course.format];
            return (
              <div
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className="bg-white rounded-xl border border-gray-100 p-5 cursor-pointer hover:border-[#0D7377]/30 transition-colors"
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
                  {course.duration_hours && <span className="flex items-center gap-1"><i className="ri-time-line" /> {course.duration_hours}h</span>}
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Completion rate</span>
                    <span>{courseEnrollments.length > 0 ? Math.round((completed / courseEnrollments.length) * 100) : 0}%</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-[#0D7377] h-1.5 rounded-full"
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
              {filteredEnrollments.map((e) => {
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
                          <div className="w-8 h-8 rounded-lg bg-[#0D7377]/10 text-[#0D7377] flex items-center justify-center text-xs font-semibold">
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
                          <div className={`h-1.5 rounded-full ${e.progress === 100 ? "bg-emerald-500" : "bg-[#0D7377]"}`} style={{ width: `${e.progress}%` }} />
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
                      ) : e.status === "completed" ? (
                        <button
                          onClick={() => issueCertificate(e.id)}
                          className="text-xs text-[#0D7377] hover:underline cursor-pointer whitespace-nowrap"
                        >
                          Issue Certificate
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setSelectedEnrollment(e)}
                        className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer whitespace-nowrap"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredEnrollments.length === 0 && (
            <div className="p-12 text-center text-gray-400 text-sm">No enrollments match your filters.</div>
          )}
        </div>
      )}

      {/* Certificates */}
      {activeTab === "certificates" && (
        <div className="grid grid-cols-3 gap-4">
          {certificates.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400 text-sm">No certificates issued yet.</div>
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
                  {e.score && <span className="font-semibold text-emerald-600">Score: {e.score}%</span>}
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
          <div className="relative w-[460px] bg-white h-full overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{selectedCourse.category}</span>
                <h3 className="text-base font-semibold text-gray-900 mt-2">{selectedCourse.title}</h3>
              </div>
              <button onClick={() => setSelectedCourse(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer">
                <i className="ri-close-line text-gray-500" />
              </button>
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
                            <div className="w-7 h-7 rounded-lg bg-[#0D7377]/10 text-[#0D7377] flex items-center justify-center text-xs font-semibold">
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
                className="w-full py-2 text-sm font-medium text-[#0D7377] border border-[#0D7377] rounded-lg hover:bg-[#0D7377]/5 cursor-pointer whitespace-nowrap"
              >
                Enroll an Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowCourseModal(false)} />
          <div className="relative bg-white rounded-2xl w-[540px] max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Add Training Course</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Course Title *</label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377]"
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
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Category</label>
                  <input
                    type="text"
                    value={newCourse.category}
                    onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377]"
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
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377]"
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
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Format</label>
                  <select
                    value={newCourse.format}
                    onChange={(e) => setNewCourse({ ...newCourse, format: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377] cursor-pointer"
                  >
                    {Object.entries(FORMAT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowCourseModal(false)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap">Cancel</button>
              <button
                onClick={saveCourse}
                disabled={saving || !newCourse.title.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#0D7377] rounded-lg hover:bg-[#0a5f62] disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {saving ? "Saving..." : "Create Course"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Employee Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowEnrollModal(false)} />
          <div className="relative bg-white rounded-2xl w-[440px]">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Enroll Employee in Course</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Course *</label>
                <select
                  value={enrollCourseId || ""}
                  onChange={(e) => setEnrollCourseId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377] cursor-pointer"
                >
                  <option value="">Select course...</option>
                  {courses.filter((c) => c.status === "active").map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Employee *</label>
                <select
                  value={enrollEmployeeId}
                  onChange={(e) => setEnrollEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377] cursor-pointer"
                >
                  <option value="">Select employee...</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name} — {e.department}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={enrollDueDate}
                  onChange={(e) => setEnrollDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377]"
                />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowEnrollModal(false)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap">Cancel</button>
              <button
                onClick={saveEnrollment}
                disabled={saving || !enrollCourseId || !enrollEmployeeId}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#0D7377] rounded-lg hover:bg-[#0a5f62] disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {saving ? "Enrolling..." : "Enroll"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}