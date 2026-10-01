import type { Employee } from "../../types";

export function renderPersonalSection(e: Employee, idStr: string): string {
  return `
    <div class="section-block">
      <div class="section-header"><span>1. Personal &amp; Demographic Information</span></div>
      <div class="section-body">
        <div class="data-grid-4">
          <div class="data-item"><div class="data-label">Gender</div><div class="data-val">${e.gender || "—"}</div></div>
          <div class="data-item"><div class="data-label">Date of Birth</div><div class="data-val">${e.date_of_birth || "—"}</div></div>
          <div class="data-item"><div class="data-label">Marital Status</div><div class="data-val">${e.marital_status || "—"}</div></div>
          <div class="data-item"><div class="data-label">Nationality</div><div class="data-val">${e.nationality || "Cambodian"}</div></div>
          <div class="data-item"><div class="data-label">Resident Status</div><div class="data-val">${e.is_resident ? "Resident" : "Non-Resident"}</div></div>
          <div class="data-item"><div class="data-label">Blood Group</div><div class="data-val">${e.blood_group || "—"}</div></div>
          <div class="data-item"><div class="data-label">Religion</div><div class="data-val">${e.religion || "—"}</div></div>
          <div class="data-item"><div class="data-label">Tax ID Number</div><div class="data-val-mono">${e.employee_tax_number || "—"}</div></div>
        </div>
        <div style="margin-top:6px; border-top:1px dashed #e2e8f0; padding-top:6px;">
          <div class="data-label">Identity Documents (National ID / Passport)</div>
          <div class="data-val-mono">${idStr}</div>
        </div>
      </div>
    </div>`;
}

export function renderContactSection(e: Employee, fullAddress: string): string {
  return `
    <div class="section-block">
      <div class="section-header"><span>2. Contact &amp; Residential Information</span></div>
      <div class="section-body">
        <div class="data-grid">
          <div class="data-item"><div class="data-label">Official Work Email</div><div class="data-val">${e.email || "—"}</div></div>
          <div class="data-item"><div class="data-label">Primary Mobile Phone</div><div class="data-val-mono">${e.phone || "—"}</div></div>
          <div class="data-item"><div class="data-label">Home / Office Phone</div><div class="data-val">${[e.home_phone, e.office_phone].filter(Boolean).join(" / ") || "—"}</div></div>
        </div>
        <div style="margin-top:6px; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div class="data-item"><div class="data-label">Present Address</div><div class="data-val">${e.current_address || fullAddress}</div></div>
          <div class="data-item"><div class="data-label">Permanent Address</div><div class="data-val">${e.permanent_address || fullAddress}</div></div>
        </div>
      </div>
    </div>`;
}

export function renderEmploymentSection(e: Employee, branchName: string, siteName: string, dept: string, pos: string, joinDate: string, managerName = "—"): string {
  const lineManagerDisplay = managerName && managerName !== "—"
    ? managerName
    : e.line_manager && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e.line_manager)
    ? e.line_manager
    : "—";

  return `
    <div class="section-block">
      <div class="section-header"><span>3. Employment &amp; Organization Terms</span></div>
      <div class="section-body">
        <div class="data-grid-4">
          <div class="data-item"><div class="data-label">Business Unit</div><div class="data-val">${branchName}</div></div>
          <div class="data-item"><div class="data-label">Department</div><div class="data-val">${dept}${e.division ? ` / ${e.division}` : ""}</div></div>
          <div class="data-item"><div class="data-label">Position</div><div class="data-val">${pos}</div></div>
          <div class="data-item"><div class="data-label">Employee Level</div><div class="data-val">${e.employee_level || "—"}</div></div>
          <div class="data-item"><div class="data-label">Employment Type</div><div class="data-val">${e.employment_type || "Full Time"}</div></div>
          <div class="data-item"><div class="data-label">Work Location</div><div class="data-val">${siteName}</div></div>
          <div class="data-item"><div class="data-label">Line Manager</div><div class="data-val">${lineManagerDisplay}</div></div>
          <div class="data-item"><div class="data-label">Biometric User ID</div><div class="data-val-mono">${e.biometric_user_id || "—"}</div></div>
        </div>
        <div style="margin-top:6px; display:grid; grid-template-columns:repeat(4, 1fr); gap:6px 12px; border-top:1px dashed #e2e8f0; padding-top:6px;">
          <div class="data-item"><div class="data-label">Join / Start Date</div><div class="data-val-mono">${joinDate}</div></div>
          <div class="data-item"><div class="data-label">Contract Type</div><div class="data-val">${e.contract_type || "UDC"}</div></div>
          <div class="data-item"><div class="data-label">Contract Effective</div><div class="data-val-mono">${e.contract_effective_date || joinDate}</div></div>
          <div class="data-item"><div class="data-label">Contract End Date</div><div class="data-val-mono">${e.contract_end_date || e.fdc_end_date || "Continuous"}</div></div>
        </div>
      </div>
    </div>`;
}

export function renderPayrollSection(e: Employee, salaryFreq: string, bankAccountStr: string): string {
  return `
    <div class="section-block">
      <div class="section-header"><span>4. Payroll, Compensation &amp; Bank Account</span></div>
      <div class="section-body">
        <div class="data-grid-4">
          <div class="data-item"><div class="data-label">Salary Frequency</div><div class="data-val">${salaryFreq}</div></div>
          <div class="data-item"><div class="data-label">NSSF Number</div><div class="data-val-mono">${e.nssf_number || (e.register_nssf ? "Registered" : "—")}</div></div>
          <div class="data-item"><div class="data-label">Tax Method</div><div class="data-val">${e.tax_method || "Gross"}</div></div>
          <div class="data-item"><div class="data-label">Tax Salary</div><div class="data-val-mono">${e.tax_salary ?? "—"}</div></div>
        </div>
        <div style="margin-top:6px; border-top:1px dashed #e2e8f0; padding-top:6px;">
          <div class="data-label">Disbursement Bank Accounts</div>
          <div class="data-val-mono">${bankAccountStr}</div>
        </div>
      </div>
    </div>`;
}

export function renderEmergencyAndFamilySection(e: Employee): string {
  const emRows = e.emergency_contacts && e.emergency_contacts.length > 0
    ? e.emergency_contacts.map((c, i) => `<tr><td style="padding:3px 5px;border:1px solid #e2e8f0">${i + 1}</td><td style="padding:3px 5px;border:1px solid #e2e8f0;font-weight:600">${c.contact_person || (c as any).name || "—"}</td><td style="padding:3px 5px;border:1px solid #e2e8f0">${c.relationship || "—"}</td><td style="padding:3px 5px;border:1px solid #e2e8f0">${c.phone_number || (c as any).phone || "—"}</td></tr>`).join("")
    : `<tr><td colspan="4" style="padding:4px;border:1px solid #e2e8f0;color:#94a3b8;text-align:center">No emergency contacts recorded</td></tr>`;

  const famRows = e.family_members && e.family_members.length > 0
    ? e.family_members.map((f, i) => `<tr><td style="padding:3px 5px;border:1px solid #e2e8f0">${i + 1}</td><td style="padding:3px 5px;border:1px solid #e2e8f0;font-weight:600">${f.name || "—"}</td><td style="padding:3px 5px;border:1px solid #e2e8f0">${f.relationship || "—"}</td><td style="padding:3px 5px;border:1px solid #e2e8f0">${f.date_of_birth || (f as any).dob || "—"}</td><td style="padding:3px 5px;border:1px solid #e2e8f0">${(f as any).occupation || f.remark || "—"}</td></tr>`).join("")
    : `<tr><td colspan="5" style="padding:4px;border:1px solid #e2e8f0;color:#94a3b8;text-align:center">No family dependents recorded</td></tr>`;

  return `
    <div class="section-block">
      <div class="section-header"><span>5. Emergency Contacts &amp; Family Dependents</span></div>
      <div class="section-body">
        <div style="font-weight:700;font-size:8px;color:#475569;text-transform:uppercase;margin-bottom:2px">Emergency Contact Persons</div>
        <table class="custom-table"><thead><tr><th style="width:24px">No</th><th>Name</th><th>Relationship</th><th>Phone</th></tr></thead><tbody>${emRows}</tbody></table>
        <div style="font-weight:700;font-size:8px;color:#475569;text-transform:uppercase;margin-top:6px;margin-bottom:2px">Family Members / Dependents</div>
        <table class="custom-table"><thead><tr><th style="width:24px">No</th><th>Full Name</th><th>Relationship</th><th>DOB</th><th>Occupation</th></tr></thead><tbody>${famRows}</tbody></table>
      </div>
    </div>`;
}

export function renderEducationAndWorkSection(e: Employee): string {
  const edRows = e.education_history && e.education_history.length > 0
    ? e.education_history.map((ed, i) => `<tr><td style="padding:3px 5px;border:1px solid #e2e8f0">${i + 1}</td><td style="padding:3px 5px;border:1px solid #e2e8f0;font-weight:600">${ed.institue || (ed as any).institution || "—"}</td><td style="padding:3px 5px;border:1px solid #e2e8f0">${ed.degree || "—"}</td><td style="padding:3px 5px;border:1px solid #e2e8f0">${ed.subject || (ed as any).field_of_study || "—"}</td><td style="padding:3px 5px;border:1px solid #e2e8f0">${ed.start_date || "—"} - ${ed.end_date || "Present"}</td></tr>`).join("")
    : `<tr><td colspan="5" style="padding:4px;border:1px solid #e2e8f0;color:#94a3b8;text-align:center">No education history recorded</td></tr>`;

  return `
    <div class="section-block">
      <div class="section-header"><span>6. Education &amp; Qualifications</span></div>
      <div class="section-body">
        <table class="custom-table"><thead><tr><th style="width:24px">No</th><th>Institution</th><th>Degree</th><th>Major</th><th>Period</th></tr></thead><tbody>${edRows}</tbody></table>
      </div>
    </div>`;
}
