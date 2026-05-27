import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { List, Grid, Globe, Download, Trash, File, Lock, Copy } from 'react-feather';
import { ScanEye, Search, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import FileCard from '../components/FileCard';
import FilePreviewModal from '../components/FilePreviewModal';
import apiEndpoint from '../util/apiEndpoint';
import ConfirmationDialog from '../components/ConfirmationDailog';
import LinkShareModal from '../components/LinkShareModal';
import ShareQrModal from '../components/ShareQrModal';
import { formatCompactDate, formatFileSize, getFileTypeMeta } from '../util/fileUi';

const MyFiles = () => {
  const [files, setFiles] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { getToken, isLoaded } = useAuth();
  const navigate = useNavigate();
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    fileId: null,
  });
  const [shareModal, setShareModal] = useState({
    isOpen: false,
    fileId: null,
    file: null,
  });
  const [qrModal, setQrModal] = useState({ isOpen: false, file: null });
  const [preview, setPreview] = useState({ isOpen: false, file: null });

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        return;
      }

      const response = await axios.get(apiEndpoint.FETCH_FILES, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFiles(response.data || []);
    } catch (error) {
      console.error('Error fetching files from server:', error);
      toast.error('Error fetching files from server');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded) {
      fetchFiles();
    }
  }, [fetchFiles, isLoaded]);

  const togglePublic = async (fileToUpdate) => {
    try {
      const token = await getToken();
      await axios.patch(apiEndpoint.TOGGLE_FILE(fileToUpdate.id), {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileToUpdate.id
            ? { ...file, isPublic: !file.isPublic }
            : file,
        ),
      );
      toast.success('File status updated');
    } catch (error) {
      console.error('Error toggling file status:', error);
      toast.error('Error updating file status');
    }
  };

  const handleDownload = async (file) => {
    try {
      const token = await getToken();
      const response = await axios.get(apiEndpoint.DOWNLOAD_FILE(file.id), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', file.name || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error(error?.response?.data?.message || 'Error downloading file');
    }
  };

  const handleDelete = async () => {
    const fileId = deleteConfirmation.fileId;
    if (!fileId) return;

    try {
      const token = await getToken();
      const response = await axios.delete(apiEndpoint.DELETE_FILE(fileId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 204) {
        setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
        setDeleteConfirmation({ isOpen: false, fileId: null });
        toast.success('File deleted successfully');
      } else {
        toast.error('Error deleting file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error(error?.response?.data?.message || 'Error deleting file');
    }
  };

  const openShareModal = (file) => {
    setShareModal({ isOpen: true, fileId: file.id, file });
  };

  const closeShareModal = () => {
    setShareModal({ isOpen: false, fileId: null, file: null });
  };

  const openQrModal = (file) => {
    setQrModal({ isOpen: true, file });
  };

  const closeQrModal = () => {
    setQrModal({ isOpen: false, file: null });
  };

  const closeVersionModal = () => {
    // kept for compatibility; version modal disabled
  };

  const openPreview = (file) => {
    setPreview({ isOpen: true, file });
  };

  const closePreview = () => setPreview({ isOpen: false, file: null });

  const closeDeletedConfirmation = () => {
    setDeleteConfirmation({ isOpen: false, fileId: null });
  };

  const openDeleteConfirmation = (fileId) => {
    setDeleteConfirmation({ isOpen: true, fileId });
  };

  const filteredFiles = useMemo(
    () => files.filter((file) => String(file.name || '').toLowerCase().includes(searchQuery.toLowerCase())),
    [files, searchQuery],
  );

  return (
    <DashboardLayout activeMenu="MyFiles">
      <div className='space-y-6 p-1 md:p-2'>
        <section className='glass-card p-6 md:p-7'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <h2 className='section-title'>My Files ({Array.isArray(files) ? files.length : 0})</h2>
              <p className='section-subtitle mt-1'>Manage visibility, temporary share links, QR codes, and version history.</p>
            </div>

            <div className='flex items-center gap-2'>
              <button type='button' className={`rounded-xl p-2 transition-colors ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-500 hover:bg-slate-100'}`} onClick={() => setViewMode('list')}>
                <List size={20} />
              </button>
              <button type='button' className={`rounded-xl p-2 transition-colors ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-500 hover:bg-slate-100'}`} onClick={() => setViewMode('grid')}>
                <Grid size={20} />
              </button>
            </div>
          </div>

          <div className='mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2'>
            <Search size={16} className='text-slate-400' />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search files by name...'
              className='w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400'
            />
          </div>
        </section>

        {loading ? (
          <div className='surface-card p-5'>
            <div className='space-y-3'>
              <div className='skeleton h-16 w-full' />
              <div className='skeleton h-16 w-full' />
              <div className='skeleton h-16 w-[92%]' />
            </div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className='glass-card p-12 text-center'>
            <File size={56} className='mx-auto mb-4 text-indigo-300' />
            <h3 className='mb-2 text-lg font-semibold text-slate-700'>No files found</h3>
            <p className='mx-auto mb-6 max-w-md text-sm text-slate-500'>Upload documents, images, and media to keep everything organized and shareable.</p>
            <button onClick={() => navigate('/upload')} className='btn-primary'>Go to Upload</button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
            {filteredFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onDelete={openDeleteConfirmation}
                onTogglePublic={togglePublic}
                onDownload={handleDownload}
                onShareLink={openShareModal}
                onQrShare={openQrModal}
                onPreview={openPreview}
              />
            ))}
          </div>
        ) : (
          <div className='glass-card overflow-x-auto px-3 py-3'>
            <table className='w-full min-w-[1120px] border-separate border-spacing-y-2'>
              <thead>
                <tr>
                  <th className='px-6 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>Name</th>
                  <th className='px-6 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>Size</th>
                  <th className='px-6 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>Uploaded</th>
                  <th className='px-6 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>Sharing</th>
                  <th className='min-w-[180px] px-6 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => {
                  const fileType = getFileTypeMeta(file.name);
                  const FileTypeIcon = fileType.icon;

                  return (
                    <tr key={file.id} className='bg-white shadow-[0_8px_25px_-20px_rgba(15,23,42,0.45)] transition-colors hover:bg-slate-50/70'>
                      <td className='rounded-l-2xl px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800'>
                        <div className='flex items-center gap-2'>
                          <FileTypeIcon size={18} className={fileType.iconClass} />
                          <span className='max-w-[240px] truncate'>{file.name}</span>
                          <span className={`soft-badge ${fileType.badgeClass}`}>{fileType.label}</span>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-600'>{formatFileSize(file.size)}</td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-600'>{formatCompactDate(file.uploadedAt)}</td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-600'>
                        <div className='flex items-center gap-4'>
                          <button onClick={() => togglePublic(file)} className='flex items-center gap-2 cursor-pointer rounded-full bg-slate-100 px-3 py-1.5'>
                            {file.isPublic ? (
                              <>
                                <Globe size={16} className='text-green-500' />
                                <span className='text-xs font-semibold text-green-700'>Public</span>
                              </>
                            ) : (
                              <>
                                <Lock size={16} className='text-gray-500' />
                                <span className='text-xs font-semibold text-slate-700'>Private</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => openShareModal(file)}
                            className='flex items-center gap-2 cursor-pointer rounded-full bg-blue-50 px-3 py-1.5 text-blue-600'
                          >
                            <Copy size={16} />
                            <span className='text-xs font-semibold'>Share Link</span>
                          </button>
                        </div>
                      </td>
                      <td className='rounded-r-2xl px-6 py-4 whitespace-nowrap text-sm font-medium min-w-[180px]'>
                        <div className='grid grid-cols-4 gap-3'>
                          <div className='flex justify-center'>
                            <button onClick={() => handleDownload(file)} title='Download' className='rounded-full bg-slate-100 p-2 text-slate-500 hover:text-blue-600'>
                              <Download size={18} />
                            </button>
                          </div>
                          <div className='flex justify-center'>
                            <button onClick={() => openDeleteConfirmation(file.id)} title='Delete' className='rounded-full bg-slate-100 p-2 text-slate-500 hover:text-red-600'>
                              <Trash size={18} />
                            </button>
                          </div>
                          <div className='flex justify-center'>
                            <button onClick={() => openQrModal(file)} className='rounded-full bg-slate-100 p-2 text-slate-500 hover:text-indigo-600' title='QR share'>
                              <QrCode size={18} />
                            </button>
                          </div>
                          <div className='flex justify-center'>
                            <button onClick={() => openPreview(file)} className='rounded-full bg-slate-100 p-2 text-slate-500 hover:text-blue-600' title='Preview file'>
                              <ScanEye size={18} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <ConfirmationDialog
          isOpen={deleteConfirmation.isOpen}
          onClose={closeDeletedConfirmation}
          title='Delete File'
          message='Are you sure you want to delete this file? This action cannot be undone.'
          confirmText='Delete'
          cancelText='Cancel'
          onConfirm={handleDelete}
          confirmationButtonClass='bg-red-600 hover:bg-red-700'
        />

        <LinkShareModal
          isOpen={shareModal.isOpen}
          onClose={closeShareModal}
          fileId={shareModal.fileId}
          fileName={shareModal.file?.name}
          title='Create expiring share link'
        />

        <ShareQrModal
          isOpen={qrModal.isOpen}
          onClose={closeQrModal}
          fileId={qrModal.file?.id}
          fileName={qrModal.file?.name}
        />

        {/* Version history feature disabled */}

        <FilePreviewModal isOpen={preview.isOpen} onClose={closePreview} file={preview.file} />
      </div>
    </DashboardLayout>
  );
};

export default MyFiles;
