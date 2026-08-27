import { SELF_SERVICE_TABS } from "../constants";

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabsNav({ activeTab, onTabChange }: Props) {
  return (
    <div className="flex items-center gap-1 bg-white border border-gray-200/80 rounded-2xl p-1.5 mb-5 overflow-x-auto shadow-2xs">
      {SELF_SERVICE_TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === tab.id
              ? "bg-[#253C7D] text-white shadow-sm"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
          }`}
        >
          <i className={tab.icon} />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
