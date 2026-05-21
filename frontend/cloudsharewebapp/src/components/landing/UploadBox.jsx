import React from "react";
import { Upload, X, File } from "react-feather";
import { Loader2 } from "lucide-react";

const UploadBox = ({
  files = [],
  onFileChange,
  onRemoveFile,
  onUpload,
  uploading = false,
  isUploadDisabled = false,
  remainingCredits,
  uploadProgress = 0,
}) => {
  const [dragActive, setDragActive] = React.useState(false);

  const emitSelectedFiles = (selectedFiles) => {
    if (!onFileChange || selectedFiles.length === 0) return;
    onFileChange({ target: { files: selectedFiles } });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    emitSelectedFiles(Array.from(e.dataTransfer.files || []));
  };

  return (
    <div className="glass-card mx-auto max-w-4xl p-6 md:p-8">
      <h2 className="section-title mb-2">
        Upload Files
      </h2>
      <p className="section-subtitle mb-6">
        Drop your files here and CloudShare handles secure upload and hosting.
      </p>

      <label
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all duration-300 ${
          dragActive
            ? "border-indigo-400 bg-indigo-50"
            : "border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-blue-50/60 hover:border-indigo-300"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <Upload size={40} className={`mb-3 transition-transform duration-300 ${dragActive ? "scale-110 text-indigo-600" : "text-indigo-500"}`} />
        <p className="font-medium text-slate-700">
          Click to upload or drag & drop
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Multiple files supported
        </p>
        <input
          type="file"
          multiple
          className="hidden"
          onChange={onFileChange}
        />
      </label>

      {uploading ? (
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/80 p-3">
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

      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            Selected Files ({files.length})
          </h3>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <File size={18} className="text-indigo-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onRemoveFile(index)}
                  className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-8">
        {typeof remainingCredits === "number" ? (
          <p className="mr-auto self-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
            Remaining credits: {remainingCredits}
          </p>
        ) : null}

        <button
          onClick={onUpload}
          disabled={uploading || isUploadDisabled}
          className="btn-primary min-w-[140px]"
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload Files"
          )}
        </button>
      </div>
    </div>
  );
};

export default UploadBox;
