import React from "react";
import {
  File,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Globe,
  Image,
  Lock,
} from "lucide-react";

const getFileIcon = (name = "") => {
  const ext = String(name).split(".").pop()?.toLowerCase();

  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
    return <Image size={15} className="text-violet-500" />;
  }
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) {
    return <FileVideo size={15} className="text-blue-500" />;
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return <FileSpreadsheet size={15} className="text-green-600" />;
  }
  if (["pdf", "doc", "docx", "txt", "ppt", "pptx"].includes(ext)) {
    return <FileText size={15} className="text-amber-500" />;
  }

  return <File size={15} className="text-gray-500" />;
};

const formatFileSize = (size) => {
  if (typeof size === "string") return size;
  if (!Number.isFinite(size)) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (file) => {
  const rawDate = file.uploadedAt || file.updatedAt || file.createdAt || file.date;
  if (!rawDate) return "-";
  return new Date(rawDate).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

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

const getSharingLabel = (file) => {
  if (typeof file.sharing === "string" && file.sharing.trim()) {
    return file.sharing;
  }

  if (typeof file.isPublic === "boolean") {
    return file.isPublic ? "Public" : "Private";
  }

  return "Private";
};

const isFilePublic = (file) => {
  if (typeof file.isPublic === "boolean") return file.isPublic;
  if (typeof file.sharing === "string") {
    return file.sharing.toLowerCase() === "public";
  }
  return false;
};

const RecentFiles = ({ files = [] }) => {
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="px-4 pt-4 pb-2">
        <h2 className="font-semibold text-gray-900">Recent Files ({files.length})</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-y border-gray-100 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
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
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                  No recent files found.
                </td>
              </tr>
            ) : (
              files.map((file, index) => (
                <tr key={file.id || file._id || `${file.name}-${index}`} className="border-b border-gray-100 hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.name)}
                      <span className="max-w-56 truncate text-gray-800">{file.name || "Untitled"}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-gray-600">{formatFileSize(file.size)}</td>

                  <td className="px-4 py-3 text-gray-600">{getUploaderName(file)}</td>

                  <td className="px-4 py-3 text-gray-600">{formatDate(file)}</td>

                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {isFilePublic(file) ? <Globe size={12} /> : <Lock size={12} />}
                      {getSharingLabel(file)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentFiles;