import { useTraining } from "./hooks/useTraining";
import { TrainingHeader } from "./components/TrainingHeader";
import { TrainingFilterBar } from "./components/TrainingFilterBar";
import { CoursesGridView } from "./components/views/CoursesGridView";
import { TrainingCalendarView } from "./components/views/TrainingCalendarView";
import { EnrollmentsTableView } from "./components/views/EnrollmentsTableView";
import { CertificatesGridView } from "./components/views/CertificatesGridView";
import { CourseModal } from "./components/modals/CourseModal";
import { EnrollModal } from "./components/modals/EnrollModal";
import { CourseDetailDrawer } from "./components/modals/CourseDetailDrawer";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";

export default function TrainingPage() {
  const {
    isPartnerBranchBlocked, userBranchName, userBranchId, canManage, courses,
    enrollments, employees, branches, meetingRooms, loading, activeTab, setActiveTab,
    filterCategory, setFilterCategory, filterStatus, setFilterStatus,
    filterMonth, setFilterMonth, availableMonths,
    filterScope, setFilterScope, searchQuery, setSearchQuery, page, setPage,
    categories, filteredCourses, filteredEnrollments, certificates,
    enrollTotalPages, enrollPageStart, enrollPageEnd, pagedEnrollments,
    totalEnrolled, totalCompleted, totalCerts, avgProgress, saving,
    selectedCourse, setSelectedCourse, showCourseModal, setShowCourseModal,
    showEnrollModal, setShowEnrollModal, editingCourseId, newCourse, setNewCourse,
    enrollCourseId, setEnrollCourseId, enrollEmployeeIds, setEnrollEmployeeIds,
    enrollDueDate, setEnrollDueDate, openNewCourse, openEditCourse, openEnroll,
    saveCourse, deleteCourse, saveEnrollment, updateEnrollment, deleteEnrollment,
    isSuperAdmin, effectiveBranchId,
  } = useTraining();

  const activeBranch = branches.find((b) => b.id === (effectiveBranchId || userBranchId));
  const activeBranchName = activeBranch?.name;

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F8F7] p-6 font-sans">
        <TrainingHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          totalEnrolled={0}
          totalCompleted={0}
          totalCerts={0}
          avgProgress={0}
          canManage={false}
          onNewCourse={() => {}}
          onOpenEnroll={() => {}}
          courses={[]}
          enrollments={[]}
          certificates={[]}
        />
        <PartnerBranchPrivacyShield
          moduleName="Training & Certifications"
          userBranchName={userBranchName}
          hasNoBranch={!userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F7] p-6 font-sans">
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
        courses={filteredCourses.length > 0 ? filteredCourses : courses}
        enrollments={filteredEnrollments.length > 0 ? filteredEnrollments : enrollments}
        certificates={certificates}
      />

      <TrainingFilterBar
        activeTab={activeTab}
        categories={categories}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterMonth={filterMonth}
        setFilterMonth={setFilterMonth}
        availableMonths={availableMonths}
        filterScope={filterScope}
        setFilterScope={setFilterScope}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

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
          onEnroll={openEnroll}
          onEdit={openEditCourse}
          onDelete={deleteCourse}
        />
      ) : activeTab === "calendar" ? (
        <TrainingCalendarView
          courses={filteredCourses.length > 0 ? filteredCourses : courses}
          enrollments={filteredEnrollments.length > 0 ? filteredEnrollments : enrollments}
          canManage={canManage}
          onSelectCourse={setSelectedCourse}
          onEnroll={openEnroll}
          onNewCourse={(initialDate) => openNewCourse(initialDate)}
        />
      ) : activeTab === "enrollments" ? (
        <EnrollmentsTableView
          totalFiltered={filteredEnrollments.length}
          pagedEnrollments={pagedEnrollments}
          page={page}
          totalPages={enrollTotalPages}
          pageStart={enrollPageStart}
          pageEnd={enrollPageEnd}
          canManage={canManage}
          setPage={setPage}
          onUpdate={(id, updates) => {
            updateEnrollment(id, updates);
          }}
          onDelete={deleteEnrollment}
        />
      ) : (
        <CertificatesGridView certificates={certificates} />
      )}

      <CourseModal
        open={showCourseModal}
        editingId={editingCourseId}
        form={newCourse}
        setForm={setNewCourse}
        branches={branches}
        employees={employees}
        meetingRooms={meetingRooms}
        isSuperAdmin={isSuperAdmin}
        activeBranchName={activeBranchName}
        saving={saving}
        onSave={saveCourse}
        onClose={() => setShowCourseModal(false)}
      />

      <EnrollModal
        open={showEnrollModal}
        courses={courses}
        employees={employees}
        enrollments={enrollments}
        branches={branches}
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
