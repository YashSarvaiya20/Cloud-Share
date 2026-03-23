import React, { useState } from "react";
import { Upload, X, File } from "react-feather";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import toast from "react-hot-toast";
import apiEndpoint from "../../util/apiEndpoint";
import { useNavigate } from "react-router-dom";

const UploadBox = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // handle file selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  // remove a file
  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // upload files
  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    try {
      setUploading(true);

      const token = await getToken({ template: "codehooks" });
      if (!token) {
        toast.error("Authentication failed");
        return;
      }

      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      await axios.post(apiEndpoint.UPLOAD_FILES, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Files uploaded successfully");
      setFiles([]);
      navigate("/my-files");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error.response?.data?.message || "Error uploading files"
      );
    } finally {
      setUploading(false);
    }
  };

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
          onChange={handleFileChange}
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
                  onClick={() => removeFile(index)}
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
        <button
          onClick={() => navigate("/my-files")}
          className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
          disabled={uploading}
        >
          Cancel
        </button>

        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`px-6 py-2 rounded-md text-white font-medium transition ${
            uploading
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
