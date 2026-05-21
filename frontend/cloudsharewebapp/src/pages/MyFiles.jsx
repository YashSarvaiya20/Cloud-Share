import React, { useEffect, useState } from 'react';
import { List, Grid, Globe, Download, Trash, File, Lock, Copy } from 'react-feather';
import { Eye, Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import FileCard from '../components/FileCard';
import { Video } from 'lucide-react';
import { Music } from 'react-feather';
import { Image } from 'react-feather';
import { FileText } from 'react-feather';
import { File as FileIcon } from 'react-feather';
import apiEndpoint from '../util/apiEndpoint';
import ConfirmationDialog from '../components/ConfirmationDailog';
import LinkShareModal from '../components/LinkShareModal';
import { formatCompactDate, formatFileSize, getFileTypeMeta } from '../util/fileUi';
const MyFiles=()=>{
    const [files, setFiles] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const {getToken,isLoaded} = useAuth();
    const navigate=useNavigate();
    const [deleteConfirmation, setDeleteConfirmation] = useState({
        isOpen: false,
        fileId: null,
    });
    const [shareModal, setShareModal] = useState({
        isOpen: false,
        fileId: null,
        link:"",
    });
    // fetch files from server
    const fetchFiles = async () => {
        setLoading(true);
    try {
        const token = await getToken();

        if (!token) {
            console.warn("Token not available yet");
            return;
        }

        const response = await axios.get(
            apiEndpoint.FETCH_FILES,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        setFiles(response.data);
    } catch (error) {
        console.error("Error fetching files from server:", error);
        toast.error("Error fetching files from server");
        setFiles([]); // never leave undefined
    } finally {
        setLoading(false);
    }
};

// Toggles the public/private status of a file
const togglePublic= async(fileToUpdate)=>{
    try {
        const token = await getToken();
       await  axios.patch(apiEndpoint.TOGGLE_FILE(fileToUpdate.id), {}, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
       setFiles((prevFiles) =>
            prevFiles.map((file) =>
                file.id === fileToUpdate.id 
                ? { ...file, isPublic: !file.isPublic }
                : file
            )
        );
        toast.success("File status updated");
    }catch (error) {
        console.error("Error toggling file status:", error);
        toast.error("Error updating file status");
    }
}

// handle file download

const handleDownload= async(file)=>{
    try {
        const token = await getToken();
        const response = await axios.get(apiEndpoint.DOWNLOAD_FILE(file.id), {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            responseType: 'blob', // important for file download
        })

        const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', file.name || 'download');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
        toast.success('File downloaded successfully');
    }
    catch (error) { 
        console.error("Error downloading file:", error);
        toast.error(error?.response?.data?.message || "Error downloading file");
    }
}
// closes the delete confirmation dialog
const closeDeletedConfirmation = () => {
    setDeleteConfirmation({ isOpen: false, fileId: null });
}

// open delete a file after confirmation
const openDeleteConfirmation = (fileId) => {
    setDeleteConfirmation({ isOpen: true, fileId });
}
// delete a file after confirmation
const handleDelete = async () => {
    const fileId=deleteConfirmation.fileId;
    if(!fileId) return;

    try {
        const token = await getToken();
       const response= await axios.delete(apiEndpoint.DELETE_FILE(fileId), {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
       if(response.status===204){
        setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
        closeDeletedConfirmation();
       }else {
        toast.error("Error deleting file");
       }
        toast.success("File deleted successfully");
    } catch (error) {
        console.error("Error deleting file:", error);
        toast.error(error?.response?.data?.message || "Error deleting file");
    }
}
// open share link modal
const openShareModal = (fileId) => {
    const link=`${window.location.origin}/file/${fileId}`;
    setShareModal({ isOpen: true, fileId, link });
}
// close share link modal
const closeShareModal = () => {
    setShareModal({ isOpen: false, fileId: null, link:"" });
}
useEffect(() => {
    if (isLoaded) {
        fetchFiles();
    }
}, [isLoaded]);
const filteredFiles = files.filter((file) =>
    String(file.name || "").toLowerCase().includes(searchQuery.toLowerCase())
);

    return (
        <DashboardLayout activeMenu="MyFiles">
            <div className='space-y-6 p-1 md:p-2'>
                <section className='glass-card p-6 md:p-7'>
                    <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                        <div>
                            <h2 className='section-title'>My Files ({Array.isArray(files) ? files.length : 0})</h2>
                            <p className='section-subtitle mt-1'>Manage visibility, share links, and download your cloud assets.</p>
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
                        <File size={56} className="mx-auto mb-4 text-indigo-300" />
                        <h3 className='text-lg font-semibold text-slate-700 mb-2'>No files found</h3>
                        <p className='mx-auto mb-6 max-w-md text-sm text-slate-500'>Upload documents, images, and media to keep everything organized and shareable.</p>
                        <button onClick={() => navigate('/upload')} className='btn-primary'>Go to Upload</button>
                    </div>
                ) : (viewMode === 'grid' ? (
                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                        {filteredFiles.map((file) => (
                            <FileCard key={file.id} file={file} 
                                onDelete={openDeleteConfirmation}
                                onTogglePublic={togglePublic}
                                onDownload={handleDownload}
                                onShareLink={openShareModal}
                            />
                        ))}
                    </div>
            ) : 
                (<div  className='glass-card overflow-x-auto px-3 py-3'>
                    <table className='w-full min-w-[1120px] border-separate border-spacing-y-2'>
                        <thead>
                        <tr> 
                            <th className='px-6 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider'>Name</th>
                             <th className='px-6 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider'>Size</th>
                              <th className='px-6 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider'>Uploaded</th>
                               <th className='px-6 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider'>Sharing</th>
                                <th className='min-w-[180px] px-6 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider'>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                            {filteredFiles.map((file) => {
                                const fileType = getFileTypeMeta(file.name);
                                const FileTypeIcon = fileType.icon;

                                return (
                                <tr key={file.id} className='bg-white shadow-[0_8px_25px_-20px_rgba(15,23,42,0.45)] transition-colors hover:bg-slate-50/70' >
                                    <td className='rounded-l-2xl px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800'>
                                        <div className='flex items-center gap-2'>
                                           <FileTypeIcon size={18} className={fileType.iconClass} />
                                            <span className='max-w-[240px] truncate'>{file.name}</span>
                                            <span className={`soft-badge ${fileType.badgeClass}`}>{fileType.label}</span>
                                        </div>
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-600'>
                                        {formatFileSize(file.size)}
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-600'>
                                        {formatCompactDate(file.uploadedAt)}
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-600'>
                                       <div className='flex items-center gap-4'>
                                        <button onClick={() => togglePublic(file)} className='flex items-center gap-2 cursor-pointer group rounded-full bg-slate-100 px-3 py-1.5'>
                                            {file.isPublic ? (
                                                <>
                                                <Globe size={16} className="text-green-500" />
                                                <span className='text-xs font-semibold text-green-700'>
                                                    Public
                                                </span>
                                                </>
                                            ):(
                                                <>
                                                    <Lock size={16} className="text-gray-500" />
                                                     <span className='text-xs font-semibold text-slate-700'>
                                                         Private
                                                     </span>
                                                </>
                                            )}
                                        </button>
                                        {
                                            file.isPublic && (
                                                <button 
                                                onClick={()=>openShareModal(file.id)}
                                                className='flex items-center gap-2 cursor-pointer group text-blue-600 rounded-full bg-blue-50 px-3 py-1.5'>
                                                    <Copy size={16} />
                                                    <span className='text-xs font-semibold'>
                                                        Share Link
                                                    </span>
                                                </button>)
                                        }
                                       </div>
                                    </td>
                                    <td className='rounded-r-2xl px-6 py-4 whitespace-nowrap text-sm font-medium min-w-[180px]'>  
                                        <div className='grid grid-cols-3 gap-4'>
                                            <div className='flex justify-center'>
                                                <button 
                                                onClick={()=>handleDownload(file)}
                                                title='Download'
                                                className='rounded-full bg-slate-100 p-2 text-slate-500 hover:text-blue-600'>
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                            <div className='flex justify-center'>
                                                <button
                                                onClick={()=>openDeleteConfirmation(file.id)}
                                                 title='Delete' className='rounded-full bg-slate-100 p-2 text-slate-500 hover:text-red-600'>
                                                    <Trash size={18} />
                                                </button>
                                            </div>
                                            <div className="flex justify-center">
                                                <a href={`/file/${file.id}`}
                                                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:text-blue-600"
                                                title="View file"
                                                target="_blank"
                                                rel="noreferrer"
                                                >
                                                <Eye size={18} />
                                                </a>
                                            </div>  
                                        </div>
                                    </td>
                                </tr>
                                )})} 
                            </tbody>
                        </table>
                    </div>))}
                    {/* delete confirmation dialog */}
                    <ConfirmationDialog isOpen={deleteConfirmation.isOpen}
                    onClose={closeDeletedConfirmation}
                    title='Delete File'
                    message='Are you sure you want to delete this file? This action cannot be undone.'
                    confirmText='Delete'
                    cancelText='Cancel'
                    onConfirm={handleDelete}
                    confirmationButtonClass='bg-red-600 hover:bg-red-700'
                    />

                    {/* link share modal */}
                   <LinkShareModal
                    isOpen={shareModal.isOpen}
                    onClose={closeShareModal}
                    shareUrl={shareModal.link}
                    />

            </div>
        </DashboardLayout>
    )
}
export default MyFiles; 