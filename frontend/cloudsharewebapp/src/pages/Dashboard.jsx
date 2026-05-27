import { useAuth } from "@clerk/clerk-react";
import DashboardLayout from "../layout/DashboardLayout";
import React, { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { useState, useEffect, useContext, useCallback } from "react";
import { Activity, Clock3, Loader2, UploadCloud } from "lucide-react";
import axios from "axios";
import apiEndpoint from "../util/apiEndpoint";
import DashboardUpload from "../components/DashboardUpload";
import RecentFiles from "../components/RecentFiles";
import { UserCreditsContext } from "../context/UserCreditsContext";
import { formatFileSize } from "../util/fileUi";
import { getUploadPathForFile } from "../util/folderUpload.js";

const StorageCharts = lazy(() => import("../components/dashboard/StorageCharts"));

const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [uploadFile, setUploadFile] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [remainingUploads, setRemainingUploads] = useState(5);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    setUploadProgress(0);
    setMessage("Uploading files...");
    setMessageType("info");

    const formData = new FormData();
    uploadFile.forEach((file) => {
      formData.append("files", file);
      formData.append("paths", getUploadPathForFile(file));
    });

    try {
      const token = await getToken();

      const response = await axios.post(apiEndpoint.UPLOAD_FILES, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || 1;
          const percent = Math.min(100, Math.round((progressEvent.loaded * 100) / total));
          setUploadProgress(percent);
        },
      });

      const uploadedCount = response.data?.files?.length ?? uploadFile.length;

      setMessage(`${uploadedCount} file${uploadedCount === 1 ? "" : "s"} uploaded successfully!`);
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
      setUploadProgress(0);
    }
  };

  const totalSize = files.reduce((acc, file) => acc + (Number(file.size) || 0), 0);

  const usageLimit = 1024 * 1024 * 1024;
  const usagePct = Math.min(100, Math.round((totalSize / usageLimit) * 100));

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="space-y-6 p-1 md:p-2">

        <section className="glass-card p-6 md:p-7">
          <h1 className="section-title">Workspace Overview</h1>
          <p className="section-subtitle mt-1">
            Upload, manage, and share your files with a fast cloud workflow.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="surface-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent Files</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{files.length}</p>
            </div>
            <div className="surface-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quick Upload Slots</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{remainingUploads}</p>
            </div>
            <div className="surface-card p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Activity size={13} />
                Storage Used (Recent)
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatFileSize(totalSize)}</p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            </div>
            <motion.div className="surface-card p-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Clock3 size={13} />
                Last Sync
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">Just now</p>
            </motion.div>
          </div>
        </section>

        <Suspense
          fallback={
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="glass-card h-[320px] xl:col-span-5 p-5">
                <div className="skeleton h-5 w-1/3" />
                <div className="skeleton mt-4 h-[240px] w-full" />
              </div>
              <div className="glass-card h-[320px] xl:col-span-7 p-5">
                <div className="skeleton h-5 w-1/3" />
                <div className="skeleton mt-4 h-[240px] w-full" />
              </div>
            </section>
          }
        >
          <StorageCharts files={files} />
        </Suspense>

        {message && (
          <div
            className={`rounded-2xl border p-4 text-sm font-medium ${
              messageType === "error"
                ? "border-red-100 bg-red-50 text-red-700"
                : messageType === "success"
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-indigo-100 bg-indigo-50 text-indigo-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <DashboardUpload
              files={uploadFile}
              onFileChange={handleFileChange}
              onRemoveFile={handleRemoveFile}
              onUpload={handleUpload}
              uploading={uploading}
              uploadProgress={uploadProgress}
              remainingUploads={remainingUploads}
              isUploadDisabled={uploadFile.length === 0 || uploadFile.length > MAX_FILES}
            />

            <div className="surface-card mt-4 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <UploadCloud size={16} className="text-indigo-500" />
                Upload Tips
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Upload images, PDFs, docs, or media. Use public links for quick sharing and keep private files locked by default.
              </p>
            </div>
          </div>

          <div className="xl:col-span-8">
            {loading ? (
              <div className="surface-card p-5">
                <div className="mb-4 flex items-center gap-3">
                  <Loader2 size={18} className="animate-spin text-indigo-500" />
                  <p className="text-sm font-medium text-slate-600">Loading your files...</p>
                </div>
                <div className="space-y-2">
                  <div className="skeleton h-10 w-full" />
                  <div className="skeleton h-10 w-full" />
                  <div className="skeleton h-10 w-full" />
                  <div className="skeleton h-10 w-[85%]" />
                </div>
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