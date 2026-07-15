import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Payslip {
  id: string;
  month: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  net_pay: number;
  status: string;
}

interface Props {
  employeeId: string;
  employeeName: string;
}

const STATUS_COLOR: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  processed: "bg-sky-50 text-sky-700",
  pending: "bg-amber-50 text-amber-700",
};

export default function PayslipTab({ employeeId, employeeName }: Props) {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Payslip | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    supabase
      .from("payroll_records")
      .select("*")
      .eq("employee_id", employeeId)
      .order("month", { ascending: false })
      .then(({ data }) => {
        setPayslips(data || []);
        if (data && data.length > 0) setSelected(data[0]);
        setLoading(false);
      });
  }, [employeeId]);

  const downloadPayslip = (p: Payslip) => {
    const gross = Number(p.base_salary) + Number(p.bonus);
    const html = `<!DOCTYPE html><html><head><title>Payslip ${p.month}</title><style>
      body{font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:0 auto;color:#111}
      h2{font-size:22px;margin-bottom:2px}p.sub{color:#666;font-size:13px;margin-bottom:30px}
      .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px}
      .row.total{font-weight:bold;font-size:16px;border-top:2px solid #111;border-bottom:none;margin-top:10px}
      .badge{background:#d1fae5;color:#065f46;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:600}
    </style></head><body>
      <h2>HR Nexus — Payslip</h2>
      <p class="sub">Employee: ${employeeName} &nbsp;|&nbsp; Period: ${p.month} &nbsp;|&nbsp; Status: <span class="badge">${p.status}</span></p>
      <div class="row"><span>Base Salary</span><span>$${Number(p.base_salary).toLocaleString()}</span></div>
      <div class="row"><span>Bonus</span><span>$${Number(p.bonus).toLocaleString()}</span></div>
      <div class="row"><span>Gross Pay</span><span>$${gross.toLocaleString()}</span></div>
      <div class="row"><span>Deductions</span><span style="color:#e11d48">-$${Number(p.deductions).toLocaleString()}</span></div>
      <div class="row total"><span>Net Pay</span><span>$${Number(p.net_pay).toLocaleString()}</span></div>
      <p style="font-size:11px;color:#999;margin-top:30px">Generated: ${new Date().toLocaleString()} &nbsp;·&nbsp; HR Nexus HRMS &nbsp;·&nbsp; Confidential</p>
    </body></html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); win.onload = () => { win.print(); win.close(); }; }
  };

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" /></div>;

  if (payslips.length === 0) return (
    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
      <i className="ri-file-list-3-line text-3xl mb-2" />
      <p className="text-sm">No payslips found</p>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* List */}
      <div className="lg:w-64 shrink-0 space-y-2">
        {payslips.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${selected?.id === p.id ? "border-[#0D7377] bg-[#0D7377]/5" : "border-gray-100 hover:border-gray-200 bg-white"}`}
          >
            <div>
              <p className="text-sm font-semibold text-gray-900">{p.month}</p>
              <p className="text-xs text-gray-500 mt-0.5">${Number(p.net_pay).toLocaleString()} net</p>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLOR[p.status] || "bg-gray-100 text-gray-600"}`}>{p.status}</span>
          </button>
        ))}
      </div>

      {/* Payslip Detail */}
      {selected && (
        <div className="flex-1 bg-white border border-gray-100 rounded-xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Payslip — {selected.month}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{employeeName}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLOR[selected.status] || "bg-gray-100 text-gray-600"}`}>{selected.status}</span>
              <button
                onClick={() => downloadPayslip(selected)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs hover:bg-gray-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-download-line" />
                Download
              </button>
            </div>
          </div>

          <div className="space-y-0">
            {[
              { label: "Base Salary", value: `$${Number(selected.base_salary).toLocaleString()}`, color: "text-gray-900" },
              { label: "Performance Bonus", value: `+$${Number(selected.bonus).toLocaleString()}`, color: "text-emerald-600" },
              { label: "Gross Pay", value: `$${(Number(selected.base_salary) + Number(selected.bonus)).toLocaleString()}`, color: "text-gray-900", bold: true },
            ].map((row) => (
              <div key={row.label} className={`flex justify-between py-3 border-b border-gray-100 ${row.bold ? "font-semibold" : ""}`}>
                <span className="text-sm text-gray-600">{row.label}</span>
                <span className={`text-sm ${row.color}`}>{row.value}</span>
              </div>
            ))}
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Deductions (Tax &amp; Benefits)</span>
              <span className="text-sm text-red-500">-${Number(selected.deductions).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-4 mt-1">
              <span className="text-base font-bold text-gray-900">Net Pay</span>
              <span className="text-xl font-bold text-[#0D7377]">${Number(selected.net_pay).toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
            <i className="ri-information-line text-gray-400 text-sm" />
            <p className="text-xs text-gray-500">Payslip generated by HR Nexus HRMS. For payroll queries contact your HR administrator.</p>
          </div>
        </div>
      )}
    </div>
  );
}