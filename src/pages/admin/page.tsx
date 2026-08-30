import { useAdmin } from "./hooks/useAdmin";
import { AdminHeader } from "./components/AdminHeader";
import { AdminNavTabs } from "./components/AdminNavTabs";
import { RolesTab } from "./components/RolesTab";
import { UsersTab } from "./components/UsersTab";
import { PasswordResetsTab } from "./components/PasswordResetsTab";
import { RoleFormModal } from "./components/RoleFormModal";

export default function AdminPortal() {
  const admin = useAdmin();

  return (
    <div className="min-h-screen bg-[#F8F8F7] p-4 md:p-6">
      {/* Toast Notification */}
      {admin.toast && (
        <div
          className={`fixed top-5 right-5 z-50 text-white text-sm px-4 py-3 rounded-xl ${
            admin.toast.type === "ok" ? "bg-gray-900" : "bg-red-600"
          }`}
        >
          {admin.toast.msg}
        </div>
      )}

      {/* Header */}
      <AdminHeader
        isSuperAdmin={admin.isSuperAdmin}
        userBranchName={admin.userBranchName}
      />

      {/* Tabs */}
      <AdminNavTabs
        activeTab={admin.activeTab}
        setActiveTab={admin.setActiveTab}
        pendingResetCount={admin.resets.pendingResetCount}
      />

      {admin.data.loading ? (
        <div className="flex items-center justify-center h-60">
          <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {admin.activeTab === "roles" && (
            <RolesTab
              roles={admin.data.roles}
              users={admin.data.users}
              isSuperAdmin={admin.isSuperAdmin}
              onOpenNewRole={admin.roles.openNewRole}
              onOpenEditRole={admin.roles.openEditRole}
              onDeleteRole={admin.roles.deleteRole}
            />
          )}

          {admin.activeTab === "users" && (
            <UsersTab
              users={admin.data.users}
              roles={admin.data.roles}
              employees={admin.data.employees}
              branches={admin.scopedBranches}
              filterBranch={admin.filterBranch}
              setFilterBranch={admin.setFilterBranch}
              searchQuery={admin.searchQuery}
              setSearchQuery={admin.setSearchQuery}
              unconfirmedEmails={admin.data.unconfirmedEmails}
              invitingUserId={admin.users.invitingUserId}
              userLoadError={admin.data.userLoadError}
              showAddUser={admin.users.showAddUser}
              setShowAddUser={admin.users.setShowAddUser}
              newUser={admin.users.newUser}
              setNewUser={admin.users.setNewUser}
              selectedEmployeeEmail={admin.users.selectedEmployeeEmail}
              setSelectedEmployeeEmail={admin.users.setSelectedEmployeeEmail}
              savingUser={admin.users.savingUser}
              isSuperAdmin={admin.isSuperAdmin}
              onAddCurrentUser={admin.users.addCurrentUser}
              onSaveNewUser={admin.users.saveNewUser}
              onResendInvite={admin.users.resendInvite}
              onUpdateUserRole={admin.users.updateUserRole}
              onRemoveUser={admin.users.removeUser}
            />
          )}

          {admin.activeTab === "password-resets" && (
            <PasswordResetsTab
              passwordResetRequests={admin.data.passwordResetRequests}
              actingResetId={admin.resets.actingResetId}
              onRefresh={admin.data.loadData}
              onDeleteRequest={admin.resets.deleteResetRequest}
              onPasswordResetAction={admin.resets.handlePasswordResetAction}
            />
          )}

          {/* Role Editor Modal */}
          <RoleFormModal
            isOpen={admin.roles.showRoleForm}
            onClose={() => admin.roles.setShowRoleForm(false)}
            editingRole={admin.roles.editingRole}
            roleForm={admin.roles.roleForm}
            setRoleForm={admin.roles.setRoleForm}
            savingRole={admin.roles.savingRole}
            isSuperAdmin={admin.isSuperAdmin}
            onSaveRole={admin.roles.saveRole}
          />
        </>
      )}
    </div>
  );
}
