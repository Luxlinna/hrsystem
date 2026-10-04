import type { HiringRequest } from "../../types";
import { formatDateTime } from "../../hireUtils";
import { escapeHtml } from "./pdfFormatHelpers";

export function renderGovernanceWorkflow(r: HiringRequest): string {
  return `
    <div class="section-title">&nbsp;&nbsp;IV.&nbsp;&nbsp;&nbsp;&nbsp;Governance &amp; Multi-Stage Approval Process</div>
    <div class="workflow-box">
      <table class="workflow-grid">
        <tr>
          <!-- Stage 1: BU CEO -->
          <td>
            <div class="wf-stage-num">Stage 1: BU CEO Endorsement</div>
            ${
              r.branch_approved_by
                ? `<span class="wf-status-badge" style="background:#fef3c7;color:#92400e;">✓ ENDORSED</span>
                   <div class="wf-officer-name">${escapeHtml(r.branch_approved_by)}</div>
                   <div class="wf-date">${formatDateTime(r.branch_approved_at)}</div>`
                : `<span class="wf-status-badge" style="background:#f1f5f9;color:#64748b;">PENDING</span>
                   <div class="wf-officer-name" style="color:#94a3b8;font-style:italic;">BU CEO / Director</div>
                   <div class="wf-date">Pending Endorsement</div>`
            }
          </td>

          <!-- Stage 2: HR Manager -->
          <td>
            <div class="wf-stage-num">Stage 2: HR Manager Review</div>
            ${
              r.hr_reviewed_by
                ? `<span class="wf-status-badge" style="background:#e0f2fe;color:#0369a1;">✓ REVIEWED</span>
                   <div class="wf-officer-name">${escapeHtml(r.hr_reviewed_by)}</div>
                   <div class="wf-date">${formatDateTime(r.hr_reviewed_at)}</div>`
                : `<span class="wf-status-badge" style="background:#f1f5f9;color:#64748b;">PENDING</span>
                   <div class="wf-officer-name" style="color:#94a3b8;font-style:italic;">HR Manager</div>
                   <div class="wf-date">Pending Review</div>`
            }
          </td>

          <!-- Stage 3: HR Admin Director -->
          <td>
            <div class="wf-stage-num">Stage 3: HR Admin Approval</div>
            ${
              r.hr_admin_approved_by
                ? `<span class="wf-status-badge" style="background:#e0e7ff;color:#3730a3;">✓ APPROVED</span>
                   <div class="wf-officer-name">${escapeHtml(r.hr_admin_approved_by)}</div>
                   <div class="wf-date">${formatDateTime(r.hr_admin_approved_at)}</div>`
                : `<span class="wf-status-badge" style="background:#f1f5f9;color:#64748b;">PENDING</span>
                   <div class="wf-officer-name" style="color:#94a3b8;font-style:italic;">HR Admin Director</div>
                   <div class="wf-date">Pending Approval</div>`
            }
          </td>

          <!-- Stage 4: Chairwoman -->
          <td>
            <div class="wf-stage-num">Stage 4: Chairwoman Auth</div>
            ${
              r.chairman_approved_by
                ? `<span class="wf-status-badge" style="background:#d1fae5;color:#065f46;">✓ AUTHORIZED</span>
                   <div class="wf-officer-name">${escapeHtml(r.chairman_approved_by)}</div>
                   <div class="wf-date">${formatDateTime(r.chairman_approved_at)}</div>`
                : `<span class="wf-status-badge" style="background:#f1f5f9;color:#64748b;">PENDING</span>
                   <div class="wf-officer-name" style="color:#94a3b8;font-style:italic;">Chairwoman</div>
                   <div class="wf-date">Pending Authorization</div>`
            }
          </td>
        </tr>
      </table>
    </div>
  `;
}
