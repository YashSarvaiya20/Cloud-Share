import React, { useEffect, useState } from 'react';
import { List, Grid, Globe, Download, Trash, File, Lock, Copy } from 'react-feather';
import { Eye } from 'lucide-react';
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
const MyFiles=()=>{
    const [files, setFiles] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
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
const getFileIcon = (file) => {
        const extension = file.name.split('.').pop().toLowerCase();
        if(['jpg','jpeg','png','gif','webp','svg'].includes(extension)){
            return <Image size={24} className="text-purple-500" />;
        }
        if(['mp4','webm','mav','avi','mkv'].includes(extension)){
            return <Video size={24} className="text-blue-500" />;
        }
        if(['mp3','wav','ogg','flac','m4a'].includes(extension)){
            return <Music size={24} className="text-green-500" />;
        }
        if(['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','rtf'].includes(extension)){
            return <FileText size={24} className="text-amber-500" />;
        }
        return <FileIcon size={24} className="text-purple-500" />;
     }
    return (
        <DashboardLayout activeMenu="MyFiles">
            <div className='p-6'>
                <div className='flex justify-between items-center mb-6'>
                    <h2 className='text-2xl font-bold'> My Files {Array.isArray(files) ? files.length : 0}</h2>
                    <div className='flex items-center gap-3'>
                        <List size={24} className={`transition-colors cursor-pointer ${viewMode === 'list' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`} onClick={() => setViewMode('list')} />
                        <Grid size={24} className={`transition-colors cursor-pointer ${viewMode === 'grid' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`} onClick={() => setViewMode('grid')} />
                    </div>
                </div>
                {files.length === 0 ? (
                    <div className='bg-white rounded-lg shadow p-12 flex flex-col items-center justify-center'>
                        <File size={60} className="text-purple-300 mb-4" />
                        <h3 className='text-lg font-medium text-gray-700 mb-2'>No Files uploaded yet</h3>
                        <p className='text-gray-500 text-center max-w-md mb-6'>Start uploading your files to see them listed here. you can upload documents, images, and other files to store and manage them securely.</p>
                        <button onClick={() => navigate('/upload')} className='px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors'>Go to Upload </button>
                    </div>
                ) : (viewMode === 'grid' ? (
                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                        {files.map((file) => (
                            <FileCard key={file.id} file={file} 
                                onDelete={openDeleteConfirmation}
                                onTogglePublic={togglePublic}
                                onDownload={handleDownload}
                                onShareLink={openShareModal}
                            />
                        ))}
                    </div>
            ) : 
                (<div  className='overflow-x-auto bg-white rounded-lg shadow'>
                    <table className='min-w-full'>
                        <thead className='bg-gray-50 border-b border-gray-200'>
                        <tr> 
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Name</th>
                             <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Size</th>
                              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Uploaded</th>
                               <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Sharing</th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Actions</th>
                        </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-200'>
                            {files.map((file) => (
                                <tr key={file.id} className='hover:bg-gray-50 transition-colors' >
                                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800'>
                                        <div className='flex items-center gap-2'>
                                           {getFileIcon(file)}
                                            {file.name}
                                        </div>
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm  text-gray-600'>
                                        {(file.size / (1024 * 1024)).toFixed(1)} KB
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm  text-gray-600'>
                                        {new Date(file.uploadedAt).toLocaleDateString()}
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm  text-gray-600'>
                                       <div className='flex items-center gap-4'>
                                        <button onClick={() => togglePublic(file)} className='flex items-center gap-2 cursor-pointer group'>
                                            {file.isPublic ? (
                                                <>
                                                <Globe size={16} className="text-green-500" />
                                                <span className='group-hover:underline'>
                                                    Public
                                                </span>
                                                </>
                                            ):(
                                                <>
                                                    <Lock size={16} className="text-gray-500" />
                                                     <span className='group-hover:underline'>
                                                         Private
                                                     </span>
                                                </>
                                            )}
                                        </button>
                                        {
                                            file.isPublic && (
                                                <button 
                                                onClick={()=>openShareModal(file.id)}
                                                className='flex items-center gap-2 cursor-pointer group text-blue-600'>
                                                    <Copy size={16} />
                                                    <span className='group-hover:underline'>
                                                        Share Link
                                                    </span>
                                                </button>)
                                        }
                                       </div>
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>  
                                        <div className='grid grid-cols-3 gap-4'>
                                            <div className='flex justify-center'>
                                                <button 
                                                onClick={()=>handleDownload(file)}
                                                title='Download'
                                                className='text-gray-500 hover:text-blue-600'>
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                            <div className='flex justify-center'>
                                                <button
                                                onClick={()=>openDeleteConfirmation(file.id)}
                                                 title='Delete' className='text-gray-500 hover:text-red-600'>
                                                    <Trash size={18} />
                                                </button>
                                            </div>
                                            <div className="flex justify-center">
                                                <a href={`/file/${file.id}`}
                                                className="text-gray-500 hover:text-blue-600"
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
                                
                            ))} 
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