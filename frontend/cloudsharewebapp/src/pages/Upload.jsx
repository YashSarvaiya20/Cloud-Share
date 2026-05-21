import React from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import UploadBox from '../components/landing/UploadBox';
import { useAuth } from '@clerk/clerk-react';
import { UserCreditsContext } from '../context/UserCreditsContext';
import axios from 'axios';
import apiEndpoint from '../util/apiEndpoint';
import { AlertCircle, Sparkles, UploadCloud } from 'lucide-react';

const Upload = ()=>{
    const [files,setFiles]=React.useState([]);
    const [uploading,setUploading]=React.useState(false);
    const [message,setMessage]=React.useState("");
    const [messageType,setMessageType]=React.useState("");
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const {getToken}=useAuth();
    const {credits,setCredits}=React.useContext(UserCreditsContext);
    const MAX_FILE_SIZE=5;
    const handleFileChange=(e)=>{
        const selectedFiles=Array.from(e.target.files);
        if(files.length + selectedFiles.length > MAX_FILE_SIZE){
            setMessage(`You can upload a maximum of ${MAX_FILE_SIZE} files at a time.`);
            setMessageType("error");
            return;
        }
        setFiles((prev)=>[...prev,...selectedFiles]);
        setMessage("");
        setMessageType("");
    }
    const handleRemoveFile=(index)=>{
        setFiles((prev)=>prev.filter((_,i)=>i!==index));
        setMessage("");
        setMessageType("");
    }
    const handleUpload=async()=>{
        if(files.length===0){
            setMessage("Please select at least one file to upload.");
            setMessageType("error");
            return;
        }
        if(files.length > MAX_FILE_SIZE){
            setMessage(`You can upload a maximum of ${MAX_FILE_SIZE} files at a time.`);
            setMessageType("error");
            return;
        }
        setUploading(true);
        setUploadProgress(0);
        setMessage("Uploading files...");
        setMessageType("info");

        const formData=new FormData();
        files.forEach((file)=>formData.append("files",file));

        try{
            const token = await getToken();
            if (!token) {
                throw new Error("User not authenticated");
            }
            const response=await axios.post(apiEndpoint.UPLOAD_FILES,formData,{
                headers:{
                    Authorization:`Bearer ${token}`,
                    "Content-Type":"multipart/form-data"
                },
                onUploadProgress: (progressEvent) => {
                    const total = progressEvent.total || 1;
                    const percent = Math.min(100, Math.round((progressEvent.loaded * 100) / total));
                    setUploadProgress(percent);
                },
            });
            const uploadedCount = response.data?.files?.length ?? files.length;
            if(response.data && response.data.remainingCredits!==undefined){ 
                setCredits(response.data.remainingCredits);
            }
            setMessage(`${uploadedCount} file${uploadedCount === 1 ? "" : "s"} uploaded successfully!`);
            setMessageType("success");
            setFiles([]);
        }catch(error){
            console.error("Upload error:",error);
            setMessage(error.response?.data?.message || "Error uploading files Please try again.");
            setMessageType("error");
        }finally{
            setUploading(false);
            setUploadProgress(0);
        }
    }

    const isUploadDisabled=files.length===0 || files.length>MAX_FILE_SIZE || files.length>credits || credits <= 0;
    
    return (
        <DashboardLayout activeMenu="Upload">
            <div className='space-y-6 p-1 md:p-2'>
                <section className='glass-card p-6 md:p-7'>
                    <h1 className='section-title'>Upload Center</h1>
                    <p className='section-subtitle mt-1'>Drop files, track progress, and publish shareable links in seconds.</p>

                    <div className='mt-5 grid gap-3 sm:grid-cols-3'>
                        <div className='surface-card p-4'>
                            <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500'>
                                <UploadCloud size={14} />
                                Queue
                            </div>
                            <p className='mt-2 text-2xl font-bold text-slate-900'>{files.length}</p>
                        </div>
                        <div className='surface-card p-4'>
                            <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500'>
                                <Sparkles size={14} />
                                Credits Left
                            </div>
                            <p className='mt-2 text-2xl font-bold text-slate-900'>{credits}</p>
                        </div>
                        <div className='surface-card p-4'>
                            <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Upload Limit</div>
                            <p className='mt-2 text-2xl font-bold text-slate-900'>{MAX_FILE_SIZE} / batch</p>
                        </div>
                    </div>
                </section>

                {message && (
                    <div className={`p-4 items-center rounded-2xl border flex gap-3 text-sm font-medium ${messageType==='success' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : messageType === 'error' ? 'border-red-100 bg-red-50 text-red-700' : 'border-indigo-100 bg-indigo-50 text-indigo-700'}`}>
                        {messageType==='error' && <AlertCircle size={20} />}
                        {message}
                    </div>
                )}

                <UploadBox
                    files={files}
                    onFileChange={handleFileChange}
                    onRemoveFile={handleRemoveFile}
                    onUpload={handleUpload}
                    uploading={uploading}
                    uploadProgress={uploadProgress}
                    remainingCredits={credits}
                    isUploadDisabled={isUploadDisabled}
                />
            </div>
        </DashboardLayout>
    )   
}
export default Upload;