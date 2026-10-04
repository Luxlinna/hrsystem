import { memo } from "react";
import type { UnityApp } from "../types";

interface AppInfoTabProps {
  app: UnityApp;
}

export const AppInfoTab = memo(function AppInfoTab({ app }: AppInfoTabProps) {
  return (
    <div className="space-y-4 text-xs">
      <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-3">
        {[
          { label: "Vendor", value: app.vendor },
          { label: "Version", value: app.version },
          {
            label: "Monthly Cost",
            value: app.monthly_cost > 0 ? `$${app.monthly_cost}/mo` : "Included / Free",
          },
          { label: "Status", value: app.status },
          {
            label: "Created",
            value: app.created_at
              ? new Date(app.created_at).toLocaleDateString()
              : "—",
          },
        ].map((item) => (
          <div key={item.label} className="flex justify-between items-center py-1">
            <span className="text-gray-400 font-medium">{item.label}</span>
            <span className="font-bold text-gray-800 capitalize">{item.value}</span>
          </div>
        ))}
      </div>

      <div>
        <p className="font-bold text-gray-700 mb-1.5">Description</p>
        <p className="text-gray-600 leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-100">
          {app.description}
        </p>
      </div>

      <div className="space-y-2 pt-2">
        {app.integration_url && (
          <a
            href={app.integration_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors font-semibold text-[#253C7D] hover:bg-gray-50 group"
          >
            <span>Open Application Workspace</span>
            <i className="ri-external-link-line group-hover:translate-x-0.5 transition-transform" />
          </a>
        )}

        {app.docs_url && (
          <a
            href={app.docs_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors font-semibold text-gray-700 hover:bg-gray-50 group"
          >
            <span>Integration Documentation</span>
            <i className="ri-book-open-line group-hover:translate-x-0.5 transition-transform" />
          </a>
        )}
      </div>
    </div>
  );
});
