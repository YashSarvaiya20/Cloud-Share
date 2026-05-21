import { useRef, useState } from "react";
import { Loader2, UploadCloud, X } from "lucide-react";
import React from "react";
const DashboardUpload = ({
  files = [],
  onFileChange,
  onRemoveFile,
  onUpload,
  uploading,
  remainingUploads,
  isUploadDisabled = false,
  uploadProgress = 0,
}) => {
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const emitSelectedFiles = (selectedFiles) => {
    if (!onFileChange || selectedFiles.length === 0) return;
    onFileChange({ target: { files: selectedFiles } });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    emitSelectedFiles(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const formatFileSize = (size) => {
    if (!Number.isFinite(size)) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="glass-card p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-base font-semibold text-slate-900">Quick Upload</p>
        <p className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
          {remainingUploads} of 5 files remaining
        </p>
      </div>

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-dashed p-8 text-center transition-all duration-300 ${
          isDragActive
            ? "border-indigo-400 bg-indigo-50 shadow-inner"
            : "border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-blue-50/60 hover:border-indigo-300"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-blue-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <UploadCloud className={`mx-auto ${isDragActive ? "scale-110 text-indigo-600" : "text-indigo-500"} relative transition-transform duration-300`} size={30} />
        <p className="relative mt-3 text-sm font-medium text-slate-700">Drag and drop files here</p>
        <p className="relative text-xs text-slate-500">or click to browse</p>

        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploading ? (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-indigo-700">
                <span>Uploading files</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : null}

          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-700">{file.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveFile(index)}
                className="ml-3 rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={onUpload}
            disabled={uploading || isUploadDisabled}
            className="btn-primary mt-2 w-full"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : null}
            {uploading ? "Uploading..." : "Upload Files"}
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardUpload;