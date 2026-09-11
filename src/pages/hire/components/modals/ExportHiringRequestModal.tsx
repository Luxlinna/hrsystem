import { memo, useState, useEffect, useRef } from "react";
import type { HiringRequest } from "../../types";
import { exportHiringRequestPdf, type RequisitionPdfOptions } from "../../exports/exportHiringRequestPdf";
import { toast } from "@/components/Toast";

interface Props {
  isOpen: boolean;
  request: HiringRequest | null;
  mode?: "full_requisition" | "job_description";
  onClose: () => void;
}

export const ExportHiringRequestModal = memo(function ExportHiringRequestModal({
  isOpen,
  request,
  mode = "full_requisition",
  onClose,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Logo starts with localStorage cache if available for this BU
  const [buLogo, setBuLogo] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  const [businessUnit, setBusinessUnit] = useState("");
  const [division, setDivision] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [directReportsTo, setDirectReportsTo] = useState("");
  const [levelGrade, setLevelGrade] = useState("G1");
  const [typeOfPosition, setTypeOfPosition] = useState("Internship");
  const [preparedDate, setPreparedDate] = useState("");
  const [workingDays, setWorkingDays] = useState("Monday to Saturday Half");
  const [workingTime, setWorkingTime] = useState("8:00 am – 5:00 pm");

  useEffect(() => {
    if (request) {
      const rawBu = request.branches?.name || request.business_unit || "OPS Solutions Co ., Ltd";
      const buKey = rawBu.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const cachedLogo = localStorage.getItem(`hrm_bu_logo_${buKey}`);

      if (cachedLogo) {
        setBuLogo(cachedLogo);
        setFileName("Cached BU Logo");
      } else {
        setBuLogo("");
        setFileName("");
      }

      setBusinessUnit(rawBu);
      setDivision(request.department || "IT and Development");
      setJobTitle(request.title || "Mobile Developer");
      setDirectReportsTo(request.jd_reporting_line || request.hiring_manager_name || "IT Project Manger");
      setLevelGrade("G1");
      setTypeOfPosition(
        request.employment_type || (request.position_type === "replacement" ? "Replacement" : "Full-time")
      );

      const d = request.created_at ? new Date(request.created_at) : new Date();
      setPreparedDate(
        d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      );
      setWorkingDays("Monday to Saturday Half");
      setWorkingTime("8:00 am – 5:00 pm");
    }
  }, [request]);

  if (!isOpen || !request) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("Invalid File", "Please select a valid image file (PNG, JPG, SVG, WebP).", "warning");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const logoData = reader.result;
        setBuLogo(logoData);
        // Cache to localStorage for this BU so subsequent exports don't need re-upload
        const rawBu = request.branches?.name || request.business_unit || "OPS Solutions Co ., Ltd";
        const buKey = rawBu.toLowerCase().replace(/[^a-z0-9]/g, "_");
        try {
          localStorage.setItem(`hrm_bu_logo_${buKey}`, logoData);
        } catch {
          // Ignore localStorage quota errors
        }
        toast("Logo Uploaded", `BU logo "${file.name}" uploaded and cached successfully.`, "success");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setBuLogo("");
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (request) {
      const rawBu = request.branches?.name || request.business_unit || "OPS Solutions Co ., Ltd";
      const buKey = rawBu.toLowerCase().replace(/[^a-z0-9]/g, "_");
      localStorage.removeItem(`hrm_bu_logo_${buKey}`);
    }
  };

  const handleExport = () => {
    if (!buLogo) {
      toast("Logo Required", "You must upload a Business Unit logo before exporting.", "warning");
      return;
    }

    const opts: RequisitionPdfOptions = {
      mode,
      buLogo,
      businessUnit,
      division,
      jobTitle,
      directReportsTo,
      levelGrade,
      typeOfPosition,
      preparedDate,
      workingDays,
      workingTime,
      headOfDeptName: request.hiring_manager_name || request.branch_approved_by || undefined,
      hrAdminName: request.hr_admin_approved_by || request.hr_reviewed_by || undefined,
    };

    exportHiringRequestPdf(request, opts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#253C7D] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-lg shadow-inner">
              <i className="ri-file-pdf-2-line text-rose-300" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {mode === "full_requisition" ? "Export Personnel Requisition Form" : "Export Job Description Form"}
              </h3>
              <p className="text-xs text-blue-100/80">
                {mode === "full_requisition"
                  ? "Requisition Details + 4-Stage Approval Process"
                  : "Position Specifications & Structured Description"}{" "}
                &middot; <strong className="text-amber-300">BU Logo Required</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Mandatory BU Logo Upload Section */}
          <div
            className={`rounded-2xl border p-4 space-y-3 transition-all ${
              buLogo
                ? "bg-emerald-50/40 border-emerald-300 shadow-xs"
                : "bg-amber-50/50 border-amber-300 ring-2 ring-amber-200/70"
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    buLogo ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                  }`}
                />
                <label className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                  <i className="ri-image-add-line text-[#253C7D]" />
                  Business Unit (BU) Logo
                  <span className="text-rose-600 font-extrabold text-[11px] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    * Required to Export
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#253C7D] hover:bg-[#1B2B5A] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ri-upload-2-line text-xs" />
                  {buLogo ? "Change Logo" : "Upload BU Logo"}
                </button>

                {buLogo && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Logo Preview or Upload Prompt */}
            {buLogo ? (
              <div className="space-y-1.5">
                <div className="h-32 bg-white rounded-xl border border-emerald-200 p-4 flex items-center justify-between overflow-hidden shadow-2xs gap-4">
                  <img
                    src={buLogo}
                    alt="Uploaded BU Logo Preview"
                    className="max-h-full max-w-[320px] object-contain object-left"
                  />
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black tracking-wide text-[#253C7D] uppercase block">
                      {mode === "full_requisition" ? "Personnel Requisition Form" : "Job Description Form"}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">Header Title Preview</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-emerald-700 font-semibold px-1">
                  <span>✓ Logo &amp; Title on same line: {fileName || "image.png"}</span>
                  <span className="text-gray-400">Header Preview</span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-28 bg-white/90 rounded-xl border-2 border-dashed border-amber-300 p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-amber-50/60 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <i className="ri-upload-cloud-2-line text-xl text-amber-700" />
                </div>
                <p className="text-xs font-bold text-amber-900">
                  Click to upload the Business Unit logo
                </p>
                <p className="text-[11px] text-amber-700/80 mt-0.5">
                  You must include the logo before exporting. Supports PNG, JPG, SVG, WebP.
                </p>
              </div>
            )}
          </div>

          {/* Position Info Fields */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Form Header &amp; Placement Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Business Unit:</label>
                <input
                  type="text"
                  value={businessUnit}
                  onChange={(e) => setBusinessUnit(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Division / Dept:</label>
                <input
                  type="text"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Job Title:</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Direct Reports To:</label>
                <input
                  type="text"
                  value={directReportsTo}
                  onChange={(e) => setDirectReportsTo(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Level / Grade:</label>
                <input
                  type="text"
                  value={levelGrade}
                  onChange={(e) => setLevelGrade(e.target.value)}
                  placeholder="e.g. G1"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Type of Position:</label>
                <input
                  type="text"
                  value={typeOfPosition}
                  onChange={(e) => setTypeOfPosition(e.target.value)}
                  placeholder="e.g. Internship, Full-time"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Prepared Date:</label>
                <input
                  type="text"
                  value={preparedDate}
                  onChange={(e) => setPreparedDate(e.target.value)}
                  placeholder="e.g. 30 June 2026"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Working Days:</label>
                <input
                  type="text"
                  value={workingDays}
                  onChange={(e) => setWorkingDays(e.target.value)}
                  placeholder="e.g. Monday to Saturday Half"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Working Time:</label>
                <input
                  type="text"
                  value={workingTime}
                  onChange={(e) => setWorkingTime(e.target.value)}
                  placeholder="e.g. 8:00 am – 5:00 pm"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <div className="text-[11px]">
            {!buLogo ? (
              <span className="text-amber-700 font-bold flex items-center gap-1">
                <i className="ri-error-warning-line text-amber-600" />
                Upload a BU logo above to enable export
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <i className="ri-checkbox-circle-line text-emerald-600" />
                Ready to generate PDF
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={!buLogo}
              title={!buLogo ? "Please upload a BU logo before exporting" : "Export & Print PDF"}
              className={`px-5 py-2.5 text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 ${
                buLogo
                  ? "bg-[#253C7D] hover:bg-[#1B2B5A] text-white hover:shadow-lg cursor-pointer"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300"
              }`}
            >
              <i className="ri-printer-line text-sm" />
              <span>Generate &amp; Print PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
