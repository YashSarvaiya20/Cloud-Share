import React from "react";
import { Upload, X, File } from "react-feather";

const UploadBox = ({
  files = [],
  onFileChange,
  onRemoveFile,
  onUpload,
  uploading = false,
  isUploadDisabled = false,
  remainingCredits,
}) => {

  return (
    <div className="bg-white rounded-lg shadow p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Upload Files
      </h2>

      {/* Upload Area */}
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-purple-300 rounded-lg p-10 cursor-pointer hover:bg-purple-50 transition">
        <Upload size={40} className="text-purple-500 mb-3" />
        <p className="text-gray-700 font-medium">
          Click to upload or drag & drop
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Multiple files supported
        </p>
        <input
          type="file"
          multiple
          className="hidden"
          onChange={onFileChange}
        />
      </label>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Selected Files ({files.length})
          </h3>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 border rounded px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <File size={18} className="text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onRemoveFile(index)}
                  className="text-gray-400 hover:text-red-500"
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
          <p className="mr-auto text-sm text-gray-600 self-center">
            Remaining credits: {remainingCredits}
          </p>
        ) : null}

        <button
          onClick={onUpload}
          disabled={uploading || isUploadDisabled}
          className={`px-6 py-2 rounded-md text-white font-medium transition ${
            uploading || isUploadDisabled
              ? "bg-purple-300 cursor-not-allowed"
              : "bg-purple-500 hover:bg-purple-600"
          }`}
        >
          {uploading ? "Uploading..." : "Upload Files"}
        </button>
      </div>
    </div>
  );
};

export default UploadBox;
