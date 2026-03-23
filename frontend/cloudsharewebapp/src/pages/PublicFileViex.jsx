import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Copy, Download, File, Info, Share2 } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";

import apiEndpoint from "../util/apiEndpoint";
import LinkShareModal from "../components/LinkShareModal";

const PublicFileView = () => {
  const { fileId } = useParams();
  const { getToken } = useAuth();

  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shareModal, setShareModal] = useState({
    isOpen: false,
    link: "",
  });

  useEffect(() => {
    const getFile = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(apiEndpoint.GET_PUBLIC_FILE(fileId));
        setFile(res.data?.file ?? res.data ?? null);
        setError(null);
      } catch (err) {
        if (err.response?.status === 403) {
          try {
            const token = await getToken();

            if (!token) {
              setError("This file is private. Please sign in with the owner account.");
            } else {
              const viewRes = await axios.get(apiEndpoint.VIEW_FILE(fileId), {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              setFile(viewRes.data?.file ?? viewRes.data ?? null);
              setError(null);
            }
          } catch {
            setError("This file is private or you do not have access.");
          }
        } else if (err.response?.status === 404) {
          setError("File not found or link expired.");
        } else {
          setError(
            "Could not retrieve file. The link may be invalid or the file may have been removed."
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (fileId) getFile();
  }, [fileId, getToken]);

  const handleDownload = async () => {
    if (!file) return;

    try {
      const token = await getToken();
      const response = await axios.get(apiEndpoint.DOWNLOAD_FILE(fileId), {
        responseType: "blob",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.name || "download");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Sorry, the file could not be downloaded.");
    }
  };

  const openShareModal = () => {
    setShareModal({
      isOpen: true,
      link: window.location.href,
    });
  };

  const closeShareModal = () => {
    setShareModal({
      isOpen: false,
      link: "",
    });
  };

  /* -------------------- STATES -------------------- */

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-600">Loading file...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-600">Error</h2>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!file) return null;

  /* -------------------- UI -------------------- */

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="p-4 border-b bg-white">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Share2 className="text-blue-600" />
            <span className="font-bold text-xl text-gray-800">
              CloudShare
            </span>
          </div>

          <button
            onClick={openShareModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            <Copy size={18} />
            Share Link
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-3xl">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <File size={40} className="text-blue-500" />
              </div>
            </div>

            {/* File Name */}
            <h1 className="text-2xl font-semibold text-gray-800 break-words">
              {file.name}
            </h1>

            {/* Size + Date */}
            <p className="text-sm text-gray-500 mt-2">
              {((file.size || 0) / 1024).toFixed(2)} KB
              <span className="mx-2">&bull;</span>
              Shared on{" "}
              {file.uploadedAt
                ? new Date(file.uploadedAt).toLocaleDateString()
                : "Unknown"}
            </p>

            {/* File Type Badge */}
            <div className="my-6">
              <span className="inline-block bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                {file.type || "File"}
              </span>
            </div>

            {/* Download Button */}
            <div className="flex justify-center gap-4 my-8">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition"
              >
                <Download size={18} />
                Download File
              </button>
            </div>

            <hr className="my-8" />

            {/* File Information */}
            <h3 className="text-lg font-semibold text-left text-gray-800 mb-4">
              File Information
            </h3>

            <div className="text-left text-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">File Name:</span>
                <span className="text-gray-800 font-medium break-all">
                  {file.name}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">File Type:</span>
                <span className="text-gray-800 font-medium">
                  {file.type}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">File Size:</span>
                <span className="text-gray-800 font-medium">
                  {((file.size || 0) / 1024).toFixed(2)} KB
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Shared:</span>
                <span className="text-gray-800 font-medium">
                  {file.uploadedAt
                    ? new Date(file.uploadedAt).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex gap-2">
            <Info size={20} />
            <p className="text-sm">
              This file has been shared publicly. Anyone with this link
              can view and download it.
            </p>
          </div>
        </div>
      </main>

      {/* Share Modal */}
      <LinkShareModal
        isOpen={shareModal.isOpen}
        onClose={closeShareModal}
        shareUrl={shareModal.link}
        title="Share File"
      />
    </div>
  );
};

export default PublicFileView;
