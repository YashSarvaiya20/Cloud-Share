import React from 'react';
import { Copy, Download, Eye, Trash2 } from 'react-feather';
import { Globe, Lock } from 'lucide-react';
import { formatCompactDate, formatFileSize, getFileTypeMeta } from '../util/fileUi';

const FileCard = ({ file,onDelete,onTogglePublic,onDownload,onShareLink }) => {
    const fileType = getFileTypeMeta(file.name);
    const FileTypeIcon = fileType.icon;

    return (
       <article className='group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_14px_30px_-24px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_40px_-24px_rgba(59,130,246,0.45)]'> 
           <div className='relative flex h-36 items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 p-4'>
             <div className='absolute left-3 top-3 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur'>
               {fileType.label}
             </div>
             <FileTypeIcon size={32} className={fileType.iconClass} />
           </div>

           <div className='absolute right-3 top-3'>
             <div className={`rounded-full p-1.5 shadow-sm ${file.isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`} title={file.isPublic ? 'Public' : 'Private'}>
               {file.isPublic ? <Globe size={14} /> : <Lock size={14} />}
             </div>
           </div>

           <div className='p-4'>
             <h3 title={file.name} className='truncate text-sm font-semibold text-slate-900'>{file.name}</h3>
             <p className='mt-1 text-xs text-slate-500'>{formatFileSize(file.size)} • {formatCompactDate(file.uploadedAt)}</p>
           </div>

                <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-slate-900/75 via-slate-900/40 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex gap-2">
                        {file.isPublic && (
                        <button
                            onClick={()=>onShareLink(file.id)}
                            title="Copy link"
                            className="rounded-full bg-white p-2.5 text-purple-600 shadow-md transition-all hover:scale-105 hover:bg-purple-50 hover:text-purple-700" >
                            <Copy size={16} />
                        </button>
                        )}
                        <a href={`/file/${file.id}`} title='View file' target="_blank" rel="noreferrer" className='rounded-full bg-white p-2.5 text-slate-700 transition-colors hover:bg-white hover:text-slate-900'>
                            <Eye size={16} />
                        </a>
                        <button
                        onClick={()=>onDownload(file)} 
                        title='Download'
                        className='rounded-full bg-white p-2.5 text-green-600 transition-colors hover:bg-white hover:text-green-700'>
                            <Download size={16} />
                        </button>
                        <button 
                        onClick={()=>onTogglePublic(file)}
                        title={file.isPublic ? 'Make Private' : 'Make Public'}
                        className='rounded-full bg-white p-2.5 text-amber-600 transition-colors hover:bg-white hover:text-amber-700'>
                            {file.isPublic ? <Lock size={16} /> : <Globe size={16} />}
                       </button>

                       <button onClick={()=>onDelete(file.id)} title="Delete" className='rounded-full bg-white p-2.5 text-red-600 transition-colors hover:bg-white hover:text-red-700'>
                        <Trash2 size={16} />
                       </button>
                    </div>
                </div>
       </article>
    )
}
export default FileCard;   