import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import type { Employee } from "../../types";
import { DEPT_COLORS } from "../../constants";

interface OrgChartDepartmentsViewProps {
  employees: Employee[];
  searchTerm: string;
  onSelectEmployee: (emp: Employee) => void;
}

export const OrgChartDepartmentsView = memo(function OrgChartDepartmentsView({
  employees,
  searchTerm,
  onSelectEmployee,
}: OrgChartDepartmentsViewProps) {
  // Group employees by department
  const deptGroups = useMemo(() => {
    const groups: Record<
      string,
      {
        department: string;
        leads: Employee[];
        members: Employee[];
        total: number;
      }
    > = {};

    employees.forEach((emp) => {
      const dept = emp.department || "General";
      if (!groups[dept]) {
        groups[dept] = {
          department: dept,
          leads: [],
          members: [],
          total: 0,
        };
      }
      groups[dept].total += 1;

      // Determine if lead: role contains Manager/Lead/Head/Director/Chief/Officer
      const isLead =
        /manager|lead|head|director|chief|president|officer/i.test(emp.role) ||
        !emp.reports_to;

      if (isLead) {
        groups[dept].leads.push(emp);
      } else {
        groups[dept].members.push(emp);
      }
    });

    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [employees]);

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return deptGroups;
    const q = searchTerm.toLowerCase();
    return deptGroups
      .map((g) => {
        const matchesDept = g.department.toLowerCase().includes(q);
        const filteredLeads = g.leads.filter(
          (e) =>
            `${e.first_name} ${e.last_name} ${e.role}`.toLowerCase().includes(q)
        );
        const filteredMembers = g.members.filter(
          (e) =>
            `${e.first_name} ${e.last_name} ${e.role}`.toLowerCase().includes(q)
        );

        if (matchesDept) return g;
        if (filteredLeads.length > 0 || filteredMembers.length > 0) {
          return {
            ...g,
            leads: filteredLeads,
            members: filteredMembers,
            total: filteredLeads.length + filteredMembers.length,
          };
        }
        return null;
      })
      .filter(Boolean) as typeof deptGroups;
  }, [deptGroups, searchTerm]);

  if (filteredGroups.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 shadow-2xs">
        <i className="ri-team-line text-4xl text-gray-300 mb-3 block" />
        <p className="text-sm font-semibold text-gray-600">No departments match your filter.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {filteredGroups.map((group) => {
        const deptColor = DEPT_COLORS[group.department] || "bg-[#253C7D]";

        return (
          <div
            key={group.department}
            className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col"
          >
            {/* Department Card Header */}
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 via-white to-transparent flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3.5 h-3.5 rounded-full ${deptColor}`} />
                <h3 className="text-base font-bold text-gray-900">{group.department}</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                {group.total} {group.total === 1 ? "Member" : "Members"}
              </span>
            </div>

            <div className="p-5 space-y-4 flex-1">
              {/* Department Leads Section */}
              {group.leads.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <i className="ri-shield-star-line text-amber-500 text-xs" />
                    Department Leadership
                  </p>
                  <div className="space-y-2">
                    {group.leads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => onSelectEmployee(lead)}
                        className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/60 hover:bg-amber-50 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {lead.avatar_url ? (
                            <img
                              src={lead.avatar_url}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-amber-200 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#253C7D] text-white font-bold text-xs flex items-center justify-center">
                              {lead.first_name?.[0]}
                              {lead.last_name?.[0]}
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-bold text-gray-900">
                              {lead.first_name} {lead.last_name}
                            </p>
                            <p className="text-[11px] text-amber-900 font-medium">{lead.role}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Lead
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Department Staff Members */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Team Members ({group.members.length})
                </p>
                {group.members.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No additional staff in this department</p>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {group.members.map((member) => (
                      <div
                        key={member.id}
                        onClick={() => onSelectEmployee(member)}
                        className="p-2.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                              {member.first_name?.[0]}
                              {member.last_name?.[0]}
                            </div>
                          )}
                          <div className="truncate">
                            <p className="text-xs font-semibold text-gray-900 truncate">
                              {member.first_name} {member.last_name}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate">{member.role}</p>
                          </div>
                        </div>

                        <Link
                          to={`/employees/${member.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-7 h-7 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 shrink-0"
                          title="View Profile"
                        >
                          <i className="ri-external-link-line text-xs" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
