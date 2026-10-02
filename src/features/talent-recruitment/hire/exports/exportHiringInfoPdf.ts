import type { Candidate } from "../types";
import { buildHiringInfoPdfHtml } from "./templates/hiringInfoPdfTemplate";
import { toast } from "@/components/Toast";

export function exportHiringInfoPdf(candidate: Candidate): void {
  if (!candidate) {
    toast("Export Failed", "Candidate record not found", "error");
    return;
  }

  try {
    const candidateName = candidate.full_name?.trim() || "Candidate";
    const exportFileName = `Hiring Information - ${candidateName}`;
    const originalTitle = document.title;

    const html = buildHiringInfoPdfHtml(candidate);
    
    // Create an invisible iframe to trigger print without blob URL in footer or popup warnings
    const iframe = document.createElement("iframe");
    iframe.setAttribute(
      "style",
      "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0.01;border:0;pointer-events:none;z-index:-9999;"
    );
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc || !iframe.contentWindow) {
      throw new Error("Unable to access print frame");
    }

    doc.open();
    doc.write(html);
    doc.close();

    // Set title on iframe and parent so browser names the PDF after the candidate instead of generic HRM_OPS
    doc.title = exportFileName;
    document.title = exportFileName;

    const restoreTitle = () => {
      document.title = originalTitle;
    };
    window.addEventListener("afterprint", restoreTitle, { once: true });
    setTimeout(restoreTitle, 5000);

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Print execution failed:", err);
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 2000);
      }
    }, 400);

    toast("PDF Ready", `Opening preview for ${exportFileName}`, "success");
  } catch (err) {
    console.error("Failed to export Hiring Info PDF:", err);
    toast("Export Error", "Could not generate PDF document", "error");
  }
}
