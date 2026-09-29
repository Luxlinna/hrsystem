import { SELF_SERVICE_TABS } from "../constants";

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabsNav({ activeTab, onTabChange }: Props) {
  return (
    <div className="flex items-center gap-1.5 border-b border-slate-200/80 mb-5 overflow-x-auto text-[13px] no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
      {SELF_SERVICE_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 outline-none focus:outline-none focus:ring-0 select-none ${
              isActive
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <i className={`${tab.icon} text-sm`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
