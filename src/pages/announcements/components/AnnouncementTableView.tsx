import { memo } from "react";
import type { Announcement } from "../types";
import { CATEGORY_CONFIG, PRIORITY_CONFIG, AUDIENCE_CONFIG } from "../constants";

interface AnnouncementTableViewProps {
  announcements: Announcement[];
  canManage: boolean;
  timeAgo: (dateStr: string) => string;
  onOpen: (a: Announcement) => void;
  onCopyLink: (a: Announcement, e?: React.MouseEvent) => void;
  onOpenEditModal: (a: Announcement, e?: React.MouseEvent) => void;
  onDeleteAnnouncement: (a: Announcement, e?: React.MouseEvent) => void;
}

export const AnnouncementTableView = memo(function AnnouncementTableView({
  announcements,
  canManage,
  timeAgo,
  onOpen,
  onCopyLink,
  onOpenEditModal,
  onDeleteAnnouncement,
}: AnnouncementTableViewProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="px-5 py-3.5">Announcement</th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5">Priority</th>
              <th className="px-5 py-3.5">Audience</th>
              <th className="px-5 py-3.5">Author</th>
              <th className="px-5 py-3.5">Views</th>
              <th className="px-5 py-3.5">Published</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {announcements.map((a) => {
              const cat = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG.general;
              const pri = PRIORITY_CONFIG[a.priority] || PRIORITY_CONFIG.normal;
              const aud = AUDIENCE_CONFIG[a.visible_to] || AUDIENCE_CONFIG.all;

              return (
                <tr
                  key={a.id}
                  onClick={() => onOpen(a)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5 max-w-sm">
                      {a.pinned && <i className="ri-pushpin-fill text-amber-500 text-sm shrink-0" />}
                      <span className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors truncate">
                        {a.title}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}>
                      <i className={cat.icon} />
                      {cat.label}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${pri.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`} />
                      {pri.label}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${aud.badge}`}>
                      {aud.label}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-800">
                    {a.author_name}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap font-black text-gray-900">
                    {(a.view_count || 0).toLocaleString()}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 font-medium">
                    {timeAgo(a.published_at)}
                  </td>

                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => onCopyLink(a, e)}
                        className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="Copy link"
                      >
                        <i className="ri-share-forward-line text-sm" />
                      </button>
                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => onOpenEditModal(a, e)}
                            className="p-1.5 text-gray-400 hover:text-[#253C7D] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit announcement"
                          >
                            <i className="ri-edit-line text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => onDeleteAnnouncement(a, e)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete announcement"
                          >
                            <i className="ri-delete-bin-line text-sm" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
