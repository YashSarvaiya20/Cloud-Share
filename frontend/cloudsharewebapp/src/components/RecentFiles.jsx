import React from "react";
import { getFileTypeMeta, getSharingMeta, formatFileSize, formatCompactDate } from "../util/fileUi";

const getUploaderName = (file) => {
  if (typeof file.uploadedBy === "string" && file.uploadedBy.trim()) {
    return file.uploadedBy;
  }

  if (file.uploadedBy && typeof file.uploadedBy === "object") {
    return (
      file.uploadedBy.name ||
      file.uploadedBy.fullName ||
      file.uploadedBy.username ||
      file.uploadedBy.email ||
      "You"
    );
  }

  return "You";
};

const RecentFiles = ({ files = [] }) => {
  return (
    <section className="glass-card overflow-hidden">
      <div className="border-b border-slate-200/70 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">Recent Files ({files.length})</h2>
      </div>

      <div className="overflow-x-auto px-3 py-3">
        <table className="min-w-full border-separate border-spacing-y-2 text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Name</th>
              <th className="px-4 py-2 text-left font-semibold">Size</th>
              <th className="px-4 py-2 text-left font-semibold">Uploaded By</th>
              <th className="px-4 py-2 text-left font-semibold">Modified</th>
              <th className="px-4 py-2 text-left font-semibold">Sharing</th>
            </tr>
          </thead>

          <tbody>
            {files.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                  No recent files found.
                </td>
              </tr>
            ) : (
              files.map((file, index) => {
                const fileType = getFileTypeMeta(file.name);
                const sharing = getSharingMeta(file.isPublic);
                const FileTypeIcon = fileType.icon;
                const SharingIcon = sharing.icon;

                return (
                <tr key={file.id || file._id || `${file.name}-${index}`} className="rounded-2xl bg-white shadow-[0_8px_25px_-20px_rgba(15,23,42,0.45)] transition-colors hover:bg-slate-50/70">
                  <td className="rounded-l-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileTypeIcon size={16} className={fileType.iconClass} />
                      <span className="max-w-56 truncate font-medium text-slate-800">{file.name || "Untitled"}</span>
                      <span className={`soft-badge ${fileType.badgeClass}`}>{fileType.label}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-slate-600">{formatFileSize(file.size)}</td>

                  <td className="px-4 py-3 text-slate-600">{getUploaderName(file)}</td>

                  <td className="px-4 py-3 text-slate-600">{formatCompactDate(file.uploadedAt || file.updatedAt || file.createdAt || file.date)}</td>

                  <td className="rounded-r-2xl px-4 py-3">
                    <span className={`soft-badge ${sharing.className}`}>
                      <SharingIcon size={12} />
                      {sharing.label}
                    </span>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default RecentFiles;