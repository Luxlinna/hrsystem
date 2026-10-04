import React, { useState } from "react";
import { AVAILABLE_CONTRACT_TYPES } from "../../hooks/useLeaveSettings";

interface LeaveTypeContractRulesSectionProps {
  excludedContractTypes: string[];
  setExcludedContractTypes: React.Dispatch<React.SetStateAction<string[]>>;
  requestInAdvance: boolean;
  setRequestInAdvance: (val: boolean) => void;
  requireAttachment: boolean;
  setRequireAttachment: (val: boolean) => void;
}

export const LeaveTypeContractRulesSection: React.FC<LeaveTypeContractRulesSectionProps> = ({
  excludedContractTypes,
  setExcludedContractTypes,
  requestInAdvance,
  setRequestInAdvance,
  requireAttachment,
  setRequireAttachment,
}) => {
  const [selectedContract, setSelectedContract] = useState("");
  const [showContractPicker, setShowContractPicker] = useState(false);

  const handleAddContract = () => {
    if (!selectedContract || excludedContractTypes.includes(selectedContract)) return;
    setExcludedContractTypes((prev) => [...prev, selectedContract]);
    setSelectedContract("");
    setShowContractPicker(false);
  };

  const handleRemoveContract = (name: string) => {
    setExcludedContractTypes((prev) => prev.filter((c) => c !== name));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-extrabold text-[#253C7D] uppercase tracking-wider">
          Leave Request Info
        </h2>
        <button
          type="button"
          onClick={() => setShowContractPicker(!showContractPicker)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#253C7D]/10 hover:bg-[#253C7D]/20 text-[#253C7D] rounded-lg text-xs font-bold transition-all cursor-pointer"
        >
          <i className="ri-add-line" />
          Add Contract Type
        </button>
      </div>

      {showContractPicker && (
        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <select
            value={selectedContract}
            onChange={(e) => setSelectedContract(e.target.value)}
            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
          >
            <option value="">Select contract type...</option>
            {AVAILABLE_CONTRACT_TYPES.filter((c) => !excludedContractTypes.includes(c)).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddContract}
            disabled={!selectedContract}
            className="px-3.5 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer"
          >
            Add
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500">Not allow for these contract types:</p>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
            <tr>
              <th className="p-3 w-16">No.</th>
              <th className="p-3">Contract Type</th>
              <th className="p-3 text-right w-20">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {excludedContractTypes.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-400">
                  No records found
                </td>
              </tr>
            ) : (
              excludedContractTypes.map((type, idx) => (
                <tr key={type} className="hover:bg-gray-50/50">
                  <td className="p-3 font-semibold text-gray-500">{idx + 1}</td>
                  <td className="p-3 font-bold text-gray-800">{type}</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveContract(type)}
                      className="text-rose-500 hover:text-rose-700 text-sm cursor-pointer"
                    >
                      <i className="ri-delete-bin-line" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 pt-2">
        <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={requestInAdvance}
            onChange={(e) => setRequestInAdvance(e.target.checked)}
            className="accent-[#253C7D] rounded"
          />
          Request In Advance
        </label>
        <div>
          <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={requireAttachment}
              onChange={(e) => setRequireAttachment(e.target.checked)}
              className="accent-[#253C7D] rounded"
            />
            Require Attachment
          </label>
        </div>
      </div>
    </div>
  );
};
