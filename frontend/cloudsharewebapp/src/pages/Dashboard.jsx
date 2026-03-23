import { useAuth } from "@clerk/clerk-react";
import DashboardLayout from "../layout/DashboardLayout";
import React from "react";
import { useState, useEffect, useContext, useCallback } from "react";
import { Loader2 } from "lucide-react";
import axios from "axios";
import apiEndpoint from "../util/apiEndpoint";
import DashboardUpload from "../components/DashboardUpload";
import RecentFiles from "../components/RecentFiles";
import { UserCreditsContext } from "../context/UserCreditsContext";

const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [uploadFile, setUploadFile] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [remainingUploads, setRemainingUploads] = useState(5);

  const { getToken } = useAuth();
  const { fetchUserCredits } = useContext(UserCreditsContext);

  const MAX_FILES = 5;

  // ✅ Move fetchFiles OUTSIDE useEffect
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get(apiEndpoint.FETCH_FILES, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const sortedFiles = res.data
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        .slice(0, 5);

      setFiles(sortedFiles);
    } catch (error) {
      console.error("Error fetching user files:", error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (uploadFile.length + selectedFiles.length > MAX_FILES) {
      setMessage(`You can only upload a maximum of ${MAX_FILES} files.`);
      setMessageType("error");
      return;
    }

    setUploadFile((prev) => [...prev, ...selectedFiles]);
    setMessage("");
    setMessageType("");
  };

  const handleRemoveFile = (index) => {
    setUploadFile((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    setRemainingUploads(MAX_FILES - uploadFile.length);
  }, [uploadFile]);

  const handleUpload = async () => {
    if (uploadFile.length === 0) {
      setMessage("Please select at least one file to upload.");
      setMessageType("error");
      return;
    }

    setUploading(true);
    setMessage("Uploading files...");
    setMessageType("info");

    const formData = new FormData();
    uploadFile.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const token = await getToken();

      await axios.post(apiEndpoint.UPLOAD_FILES, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Files uploaded successfully!");
      setMessageType("success");
      setUploadFile([]);

      await fetchFiles();           // ✅ now works
      await fetchUserCredits();     // ✅ update credits
    } catch (error) {
      console.error("Error uploading files:", error);
      setMessage(
        error.response?.data?.message || "Error uploading files."
      );
      setMessageType("error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="p-6">

        {/* HEADER */}
        <h1 className="text-2xl font-bold mb-2">My Drive</h1>
        <p className="text-gray-600 mb-6">
          Upload, manage, and share your files securely.
        </p>

        {/* MESSAGE */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              messageType === "error"
                ? "bg-red-50 text-red-700"
                : messageType === "success"
                ? "bg-green-50 text-green-700"
                : "bg-purple-50 text-purple-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* MAIN LAYOUT */}
        <div className="flex flex-col md:flex-row gap-6">

          {/* LEFT - Upload */}
          <div className="w-full md:w-[40%]">
            <DashboardUpload
              files={uploadFile}
              onFileChange={handleFileChange}
              onRemoveFile={handleRemoveFile}
              onUpload={handleUpload}
              uploading={uploading}
              remainingUploads={remainingUploads}
            />
          </div>

          {/* RIGHT - Files */}
          <div className="w-full md:w-[60%]">
            {loading ? (
              <div className="bg-white rounded-lg shadow p-8 flex flex-col items-center justify-center">
                <Loader2
                  size={40}
                  className="text-purple-500 animate-spin"
                />
                <p className="text-gray-500 mt-2">
                  Loading your files...
                </p>
              </div>
            ) : (
              <RecentFiles files={files} />
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;