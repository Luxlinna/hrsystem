import { useTraining } from "./hooks/useTraining";
import { TrainingHeader } from "./components/TrainingHeader";
import { TrainingFilterBar } from "./components/TrainingFilterBar";
import { CoursesGridView } from "./components/views/CoursesGridView";
import { EnrollmentsTableView } from "./components/views/EnrollmentsTableView";
import { CertificatesGridView } from "./components/views/CertificatesGridView";
import { CourseModal } from "./components/modals/CourseModal";
import { EnrollModal } from "./components/modals/EnrollModal";
import { CourseDetailDrawer } from "./components/modals/CourseDetailDrawer";

export default function TrainingPage() {
  const {
    canManage,
    courses,
    enrollments,
    employees,
    branches,
    loading,
    activeTab,
    setActiveTab,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    filterScope,
    setFilterScope,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    categories,
    filteredCourses,
    filteredEnrollments,
    certificates,
    enrollTotalPages,
    enrollPageStart,
    enrollPageEnd,
    pagedEnrollments,
    totalEnrolled,
    totalCompleted,
    totalCerts,
    avgProgress,
    saving,
    selectedCourse,
    setSelectedCourse,
    showCourseModal,
    setShowCourseModal,
    showEnrollModal,
    setShowEnrollModal,
    editingCourseId,
    newCourse,
    setNewCourse,
    enrollCourseId,
    setEnrollCourseId,
    enrollEmployeeIds,
    setEnrollEmployeeIds,
    enrollDueDate,
    setEnrollDueDate,
    openNewCourse,
    openEditCourse,
    openEnroll,
    saveCourse,
    deleteCourse,
    saveEnrollment,
    updateEnrollment,
    deleteEnrollment,
    isSuperAdmin,
    effectiveBranchId,
    userBranchId,
  } = useTraining();

  const activeBranch = branches.find((b) => b.id === (effectiveBranchId || userBranchId));
  const activeBranchName = activeBranch?.name;

  return (
    <div className="min-h-screen bg-[#F8F8F7] p-6 font-sans">
      {/* Top Header with KPI Metrics and Tab Switcher */}
      <TrainingHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalEnrolled={totalEnrolled}
        totalCompleted={totalCompleted}
        totalCerts={totalCerts}
        avgProgress={avgProgress}
        canManage={canManage}
        onNewCourse={openNewCourse}
        onOpenEnroll={() => openEnroll()}
      />

      {/* Filter and Search Bar */}
      {activeTab !== "certificates" && (
        <TrainingFilterBar
          activeTab={activeTab}
          categories={categories}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterScope={filterScope}
          setFilterScope={setFilterScope}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      {/* Tab Views */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold text-gray-500">Loading course curriculum &amp; learner progress...</p>
        </div>
      ) : activeTab === "courses" ? (
        <CoursesGridView
          courses={filteredCourses}
          enrollments={enrollments}
          canManage={canManage}
          onSelect={setSelectedCourse}
          onEdit={openEditCourse}
          onDelete={deleteCourse}
          onEnroll={openEnroll}
        />
      ) : activeTab === "enrollments" ? (
        <EnrollmentsTableView
          pagedEnrollments={pagedEnrollments}
          totalFiltered={filteredEnrollments.length}
          page={page}
          totalPages={enrollTotalPages}
          pageStart={enrollPageStart}
          pageEnd={enrollPageEnd}
          setPage={setPage}
          canManage={canManage}
          onUpdate={updateEnrollment}
          onDelete={deleteEnrollment}
        />
      ) : (
        <CertificatesGridView certificates={certificates} />
      )}

      {/* Course Modal */}
      <CourseModal
        open={showCourseModal}
        editingId={editingCourseId}
        form={newCourse}
        setForm={setNewCourse}
        branches={branches}
        isSuperAdmin={isSuperAdmin}
        activeBranchName={activeBranchName}
        saving={saving}
        onSave={saveCourse}
        onClose={() => setShowCourseModal(false)}
      />

      {/* Enroll Modal */}
      <EnrollModal
        open={showEnrollModal}
        courses={courses}
        employees={employees}
        enrollCourseId={enrollCourseId}
        setEnrollCourseId={setEnrollCourseId}
        enrollEmployeeIds={enrollEmployeeIds}
        setEnrollEmployeeIds={setEnrollEmployeeIds}
        enrollDueDate={enrollDueDate}
        setEnrollDueDate={setEnrollDueDate}
        saving={saving}
        onSave={saveEnrollment}
        onClose={() => setShowEnrollModal(false)}
      />

      {/* Course Detail Drawer */}
      <CourseDetailDrawer
        course={selectedCourse}
        enrollments={enrollments}
        canManage={canManage}
        onClose={() => setSelectedCourse(null)}
        onEdit={openEditCourse}
        onDelete={deleteCourse}
        onEnroll={openEnroll}
      />
    </div>
  );
}
