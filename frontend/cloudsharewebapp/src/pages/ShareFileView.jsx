import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Copy, Download, File, Link2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiEndpoint from '../util/apiEndpoint';
import { getFileTypeMeta } from '../util/fileUi';

const ShareFileView = () => {
  const { token } = useParams();
  const [share, setShare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadShare = async () => {
      setLoading(true);
      try {
        const response = await axios.get(apiEndpoint.SHARE_BY_TOKEN(token));
        setShare(response.data);
        setError('');
      } catch (err) {
        if (err?.response?.status === 410) {
          setError('This share link has expired. Ask the owner to generate a new link.');
        } else if (err?.response?.status === 404) {
          setError('Share link not found or removed.');
        } else {
          setError(err?.response?.data?.message || 'Unable to load shared file.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) loadShare();
  }, [token]);

  const file = share?.file;
  const fileType = useMemo(() => (file ? getFileTypeMeta(file.name) : null), [file]);
  const previewUrl = share?.streamUrl ? `${window.location.origin}${share.streamUrl}` : '';
  const downloadUrl = share?.downloadUrl ? `${window.location.origin}${share.downloadUrl}` : '';
  const absoluteShareUrl = share?.shareUrl ? `${window.location.origin}${share.shareUrl}` : '';

  const handleCopy = async (value) => {
    await navigator.clipboard.writeText(value);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-4 text-sm text-slate-300">
          <Loader2 className="animate-spin" size={18} />
          Loading shared file...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-10 text-slate-100">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-[0_24px_50px_-28px_rgba(0,0,0,0.8)]">
            <div className="inline-flex rounded-2xl bg-red-500/10 p-3 text-red-300">
              <AlertCircle size={24} />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-slate-50">Share link unavailable</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!file) return null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.22),_transparent_35%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] px-4 py-6 text-slate-100 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="glass-card border-slate-700/80 bg-slate-900/80 p-5 text-slate-100 shadow-[0_24px_60px_-30px_rgba(2,6,23,0.9)] md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-200">
                <Link2 size={12} />
                Expiring share link
              </div>
              <h1 className="mt-3 break-words text-3xl font-bold text-slate-50">{file.name}</h1>
              <p className="mt-2 text-sm text-slate-400">
                {fileType?.label || 'File'} • {file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown size'}
                {share?.expiresAt ? ` • Expires ${new Date(share.expiresAt).toLocaleString()}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleCopy(absoluteShareUrl)} className="btn-secondary">
                <Copy size={16} /> Copy share link
              </button>
              <a href={downloadUrl} target="_blank" rel="noreferrer" className="btn-primary">
                <Download size={16} /> Download
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
          <div className="glass-card border-slate-700/80 bg-slate-900/80 p-5 md:p-6">
            <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-4">
              {String(file.type || '').startsWith('image/') ? (
                <img src={previewUrl} alt={file.name} className="max-h-[72vh] w-full rounded-2xl object-contain" />
              ) : file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewUrl} title={file.name} className="h-[72vh] w-full rounded-2xl border-0 bg-white" />
              ) : String(file.type || '').startsWith('video/') ? (
                <video controls className="max-h-[72vh] w-full rounded-2xl bg-black" src={previewUrl} />
              ) : (
                <div className="flex min-h-[42vh] flex-col items-center justify-center gap-3 text-center text-slate-300">
                  <div className="rounded-3xl bg-white/5 p-4 text-indigo-300"><File size={36} /></div>
                  <p className="text-sm">Preview is not available for this file type.</p>
                  <a href={downloadUrl} className="btn-primary"><Download size={16} /> Download file</a>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="glass-card border-slate-700/80 bg-slate-900/80 p-5">
              <h2 className="text-lg font-semibold text-slate-50">File details</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex justify-between gap-4"><span className="text-slate-500">Type</span><span>{file.type || 'Unknown'}</span></div>
                <div className="flex justify-between gap-4"><span className="text-slate-500">Uploaded</span><span>{file.uploadedAt ? new Date(file.uploadedAt).toLocaleString() : 'Unknown'}</span></div>
                <div className="flex justify-between gap-4"><span className="text-slate-500">Mode</span><span>{file.isPublic ? 'Public' : 'Private'}</span></div>
                <div className="flex justify-between gap-4"><span className="text-slate-500">Share URL</span><button onClick={() => handleCopy(absoluteShareUrl)} className="text-indigo-300 hover:text-indigo-200">Copy</button></div>
              </div>
            </div>

            <div className="glass-card border-slate-700/80 bg-slate-900/80 p-5">
              <h2 className="text-lg font-semibold text-slate-50">About this link</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                This URL is temporary. When it expires, the page will stop opening and the owner must generate a new share link.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ShareFileView;
