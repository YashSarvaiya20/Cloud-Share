import React from 'react';
import { Copy, Download, Eye, FileText, Globe, Image, Music, Trash2 } from 'react-feather';
import { Video } from 'lucide-react';
import { File as FileIcon } from 'react-feather';
import { Lock } from 'react-feather';
import { Globe as GlobeIcon } from 'react-feather';
import { FileText as FileTextIcon } from 'react-feather';

const FileCard = ({ file,onDelete,onTogglePublic,onDownload,onShareLink }) => {
     const [showActions, setShowActions] = React.useState(false);
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
        
     const formatFileSize = (bytes) => {
        if (bytes <1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else  return (bytes / 1048576).toFixed(1) + ' MB';
     }

     const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
     }
    return (
       //  {/* file preview area */}
       <div onMouseEnter={()=> setShowActions(true)}
        onMouseLeave={()=> setShowActions(false)}
        className='relative group overflow-hidden rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100'> 
           <div className='h-32 bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4'>{getFileIcon(file)}</div>
           {/*public or private badge*/}
           <div className='absolute top-2 right-2'>
               <div className={`rounded-full p-1.5 ${file.isPublic ? 'bg-green-100' : 'bg-gray-100'}`} title={file.isPublic ? 'Public' : 'Private'}>
                     {file.isPublic ? (
                        <Globe size={14} className="text-green-600" />
                     ):(
                        <Lock size={14} className="text-gray-600" />
                     )}
               </div>
           </div>
              {/*file info area*/}
             <div className='p-4'>
                <div className='flex justify-between items-start'>
                    <div className='overflow-hidden'>
                        <h3 title={file.name} className='font-medium text-gray-900 truncate'>{file.name}</h3>
                        <p className='text-xs text-gray-500 mt-1'>{formatFileSize(file.size)}, {formatDate(file.uploadedAt)}</p>
                    </div>
                </div>
             </div>
                {/*action buttons*/}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex items-end justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex gap-3">
                        {file.isPublic && (
                        <button
                            onClick={()=>onShareLink(file.id)}
                            title="Copy link"
                            className="p-3 bg-white rounded-full 
                                    shadow-md cursor-pointer
                                    text-purple-600 
                                    hover:bg-purple-50 hover:text-purple-700 
                                    transition-all hover:scale-105" >
                            <Copy size={18} />
                        </button>
                        )}
                        {file.isPublic &&  (
                            <a href={`/file/${file.id}`} title='View file' target="_blank" rel="noreferrer" className='p-2 bg-white/90 rounded-fu;; hover:bg-white transition-colors text-gray-700 hover:text-gray-900'>
                                <Eye size={18} />
                            </a>
                        )}
                        <button
                        onClick={()=>onDownload(file)} 
                        title='Download'
                        className='p-2 bg-white rounded-full hover:bg-white cursor-pointer transition-colors text-green-600 hover:text-green-700'>
                            <Download size={18} />
                        </button>
                        <button 
                        onClick={()=>onTogglePublic(file)}
                        title={file.isPublic ? 'Make Private' : 'Make Public'}
                        className='p-2 bg-white rounded-full hover:bg-white cursor-pointer transition-colors text-amber-600 hover:text-amber-700'>
                            {file.isPublic ? <Lock size={18} /> : <Globe size={18} />}
                       </button>

                       <button onClick={()=>onDelete(file.id)} title="Delete" className='p-2 bg-white/90 rounded-full hover:bg-white cursor-pointer transition-colors text-red-600 hover:text-red-700'>
                        <Trash2 size={18} />
                       </button>
                    </div>
                </div>
       </div>
    )
}
export default FileCard;   