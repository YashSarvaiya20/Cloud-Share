import React from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import UploadBox from '../components/landing/UploadBox';
import { useAuth } from '@clerk/clerk-react';
import { UserCreditsContext } from '../context/UserCreditsContext';
import axios from 'axios';
import apiEndpoint from '../util/apiEndpoint';
import { AlertCircle } from 'react-feather';

const Upload = ()=>{
    const [files,setFiles]=React.useState([]);
    const [uploading,setUploading]=React.useState(false);
    const [message,setMessage]=React.useState("");
    const [messageType,setMessageType]=React.useState("");
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
                }
            });
            if(response.data && response.data.remainingCredits!==undefined){ 
                setCredits(response.data.remainingCredits);
            }
            setMessage("Files uploaded successfully!");
            setMessageType("success");
            setFiles([]);
        }catch(error){
            console.error("Upload error:",error);
            setMessage(error.response?.data?.message || "Error uploading files Please try again.");
            setMessageType("error");
        }finally{
            setUploading(false);
        }
    }

    const isUploadDisabled=files.length===0 || files.length>MAX_FILE_SIZE || files.length>credits || credits <= 0;
    
    return (
        <DashboardLayout activeMenu="Upload">
            <div className='p-6'>
                {message && (
                    <div className={`mb-6 p-4 items-center rounded-lg flex gap-3 ${messageType==='success' ? 'bg-green-50 text-green-700' : messageType === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
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
                    remainingCredits={credits}
                    isUploadDisabled={isUploadDisabled}
                />
            </div>
        </DashboardLayout>
    )   
}
export default Upload;