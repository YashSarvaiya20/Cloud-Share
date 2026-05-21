import {
  File,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Globe,
  Image,
  Lock,
  Music,
} from "lucide-react";

export const getFileTypeMeta = (name = "") => {
  const extension = String(name).split(".").pop()?.toLowerCase() || "";

  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension)) {
    return {
      label: "Image",
      icon: Image,
      iconClass: "text-fuchsia-600",
      badgeClass: "bg-fuchsia-100 text-fuchsia-700",
    };
  }

  if (["mp4", "mov", "avi", "mkv", "webm"].includes(extension)) {
    return {
      label: "Video",
      icon: FileVideo,
      iconClass: "text-blue-600",
      badgeClass: "bg-blue-100 text-blue-700",
    };
  }

  if (["mp3", "wav", "ogg", "m4a", "flac"].includes(extension)) {
    return {
      label: "Audio",
      icon: Music,
      iconClass: "text-emerald-600",
      badgeClass: "bg-emerald-100 text-emerald-700",
    };
  }

  if (["xls", "xlsx", "csv"].includes(extension)) {
    return {
      label: "Spreadsheet",
      icon: FileSpreadsheet,
      iconClass: "text-emerald-700",
      badgeClass: "bg-emerald-100 text-emerald-700",
    };
  }

  if (["pdf", "doc", "docx", "txt", "ppt", "pptx", "rtf"].includes(extension)) {
    return {
      label: "Document",
      icon: FileText,
      iconClass: "text-amber-600",
      badgeClass: "bg-amber-100 text-amber-700",
    };
  }

  return {
    label: "File",
    icon: File,
    iconClass: "text-slate-600",
    badgeClass: "bg-slate-100 text-slate-700",
  };
};

export const getSharingMeta = (isPublic) => {
  if (Boolean(isPublic)) {
    return {
      label: "Public",
      icon: Globe,
      className: "bg-emerald-100 text-emerald-700",
    };
  }

  return {
    label: "Private",
    icon: Lock,
    className: "bg-slate-100 text-slate-700",
  };
};

export const formatFileSize = (size) => {
  if (typeof size === "string") return size;
  if (!Number.isFinite(size)) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatCompactDate = (rawDate) => {
  if (!rawDate) return "-";

  return new Date(rawDate).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
