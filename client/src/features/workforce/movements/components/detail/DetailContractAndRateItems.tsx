import React from "react";

interface DetailContractAndRateItemsProps {
  contractType: string;
  contractPeriod: string;
  rateItems: any[];
  documentUrl?: string | null;
  documentName?: string | null;
}

export const DetailContractAndRateItems: React.FC<DetailContractAndRateItemsProps> = ({
  contractType,
  contractPeriod,
  rateItems,
  documentUrl,
  documentName,
}) => {
  return (
    <>
      {/* SECTION 3: CONTRACT INFO */}
      <div>
        <h2 className="text-xs font-bold text-[#29ABE2] uppercase tracking-wider mb-4">
          CONTRACT INFO
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-y-3 text-xs">
          <div className="text-slate-600 font-normal">Contract Type</div>
          <div className="font-normal text-slate-800">{contractType}</div>
          <div className="text-slate-600 font-normal">Contract Date</div>
          <div className="font-normal text-slate-800">{contractPeriod}</div>
        </div>
      </div>

      {/* SECTION 4: RATE ITEM INFO */}
      <div>
        <h2 className="text-xs font-bold text-[#29ABE2] uppercase tracking-wider mb-3">
          RATE ITEM INFO
        </h2>
        <div className="w-full overflow-x-auto border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-white border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="py-2.5 px-3 w-14 text-center font-medium">No.</th>
                <th className="py-2.5 px-3 min-w-[200px] font-semibold">Rate Item Name</th>
                <th className="py-2.5 px-3 min-w-[120px] font-semibold">Amount</th>
                <th className="py-2.5 px-3 font-semibold">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rateItems.map((item: any, idx: number) => (
                <tr key={item.name || idx} className="hover:bg-slate-50 text-xs text-slate-700">
                  <td className="py-2 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                  <td className="py-2 px-3 font-normal text-slate-800">{item.name}</td>
                  <td className="py-2 px-3 font-normal text-slate-800">
                    {typeof item.amount === "number" ? item.amount.toFixed(2) : item.amount || "0.00"}
                  </td>
                  <td className="py-2 px-3 text-slate-500 font-normal">{item.remark || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5: ATTACHMENT INFO */}
      <div>
        <h2 className="text-xs font-bold text-[#29ABE2] uppercase tracking-wider mb-3">
          ATTACHMENT INFO
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 items-center text-xs">
          <div className="text-slate-600 font-normal">Attachment</div>
          <div>
            {documentUrl ? (
              <a
                href={documentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded border border-slate-300 bg-slate-50 text-slate-700 hover:text-sky-600 transition-colors shadow-2xs"
              >
                <i className="ri-attachment-2 text-sm text-[#253C7D]" />
                <span className="font-medium">{documentName || "Download Supporting Document"}</span>
              </a>
            ) : (
              <div className="border border-dashed border-slate-300 rounded p-4 text-center text-xs text-slate-400 bg-white">
                <span>☁ Drop file here or <strong className="text-sky-600 font-medium cursor-pointer">Browse</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
