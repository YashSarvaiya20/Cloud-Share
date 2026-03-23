import { useRef } from "react";
import { Loader2, UploadCloud, X } from "lucide-react";
import React from "react";
const DashboardUpload = ({
  files = [],
  onFileChange,
  onRemoveFile,
  onUpload,
  uploading,
  remainingUploads,
}) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const emitSelectedFiles = (selectedFiles) => {
    if (!onFileChange || selectedFiles.length === 0) return;
    onFileChange({ target: { files: selectedFiles } });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    emitSelectedFiles(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const formatFileSize = (size) => {
    if (!Number.isFinite(size)) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold text-gray-800">Upload Files</p>
        <p className="text-xs font-medium text-gray-500">
          {remainingUploads} of 5 files remaining
        </p>
      </div>

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition"
      >
        <UploadCloud className="mx-auto text-purple-500" size={28} />
        <p className="mt-3 text-sm text-gray-700">Drag and drop files here</p>
        <p className="text-xs text-gray-400">or click to browse</p>

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
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-gray-700">{file.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveFile(index)}
                className="ml-3 rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                aria-label="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={onUpload}
            disabled={uploading}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
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