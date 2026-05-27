import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import Modal from './Modal';
import { getFileTypeMeta } from '../util/fileUi';
import { Download } from 'react-feather';
import apiEndpoint from '../util/apiEndpoint';

const FilePreviewModal = ({ isOpen, onClose, file }) => {
  const { getToken } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const blobUrlRef = useRef(null);

  // Prefer Cloudinary publicId for preview streaming so we do not depend on Mongo _id.
  const chosenId = file?.publicId || file?.public_id;
  const streamUrl = chosenId ? apiEndpoint.STREAM_FILE(chosenId) : null;
  const fileType = file ? getFileTypeMeta(file.name) : { label: 'File' };
  // Never expose raw cloudinary/fileLocation directly for embedding.
  // We'll fetch the stream endpoint with an auth token, create a blob URL
  // and use that for embedding. effectiveUrl is the blob URL.
  const [effectiveUrl, setEffectiveUrl] = useState(null);
  // debug: show which URL is used for preview
  useEffect(() => {
    // reset state when file changes; actual blob will be set after fetching
    setEffectiveUrl(null);
    console.debug('FilePreviewModal: resolved preview ->', { chosenId, streamUrl, file });
  }, [chosenId, streamUrl, file]);

  // If the preview URL is our backend stream endpoint, prefetch it with an
  // Authorization bearer token and convert to a blob URL so the browser sees
  // the bytes and embedding doesn't leak the raw remote URL.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!streamUrl) return;
        const ext = (file.name || '').split('.').pop()?.toLowerCase();
        const embeddable = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm'];
        if (!embeddable.includes(ext)) return;

        // Debug logs: show selected file and ids (explicit console.log for easy capture)
        try {
          console.log('Selected file:', file);
          console.log('file.publicId:', file.publicId);
          console.debug('FilePreviewModal: selected file:', file);
          console.debug('file.publicId=', file.publicId, 'streamUrl=', streamUrl);
        } catch (error) {
          console.debug('FilePreviewModal: debug logging failed', error);
        }

        // prefer token auth to cookies; get Clerk token if available
        let headers = {};
        try {
          const token = await getToken();
          if (token) headers.Authorization = `Bearer ${token}`;
        } catch (error) {
          console.debug('FilePreviewModal: auth token unavailable', error);
        }

        const res = await fetch(streamUrl, { headers });
        if (!res.ok) {
          console.warn('Stream fetch failed', res.status, res.statusText);
          setEmbedFailed(true);
          return;
        }

        const blob = await res.blob();
        if (cancelled) return;
        const bUrl = URL.createObjectURL(blob);
        blobUrlRef.current = bUrl;
        setBlobUrl(bUrl);
        setEffectiveUrl(bUrl);
        setLoading(false);
      } catch (err) {
        console.warn('Prefetch stream failed', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [streamUrl, file, getToken]);

  useEffect(() => {
    setLoaded(false);
    setEmbedFailed(false);
    setLoading(true);
    setEffectiveUrl(null);
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [file]);

  useEffect(() => {
    // When embedding fails, try fetching a blob fallback for common types
    if (!embedFailed) return;
    if (!streamUrl) return;

    const ext = (file.name || '').split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm'];
    if (!allowed.includes(ext)) return;

    let cancelled = false;
    (async () => {
      try {
        // Build headers (prefer token auth for our backend stream endpoint)
        let headers = {};
        try {
          const token = await getToken();
          if (token) headers.Authorization = `Bearer ${token}`;
        } catch (error) {
          console.debug('FilePreviewModal: fallback auth token unavailable', error);
        }

        let res = await fetch(streamUrl, { headers });
        // If stream returned 404 and we have an external file URL, do NOT embed raw cloud URL; only log
        if (!res.ok) {
          console.warn('Blob fallback stream failed', res.status);
          throw new Error('Failed to fetch file for blob fallback');
        }
        const blob = await res.blob();
        if (cancelled) return;
        const bUrl = URL.createObjectURL(blob);
        setBlobUrl(bUrl);
        setEffectiveUrl(bUrl);
      } catch (err) {
        console.warn('Blob fallback failed', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [embedFailed, effectiveUrl, file?.fileLocation, file, getToken, streamUrl]);

  const renderPreview = () => {
    const ext = (file.name || '').split('.').pop()?.toLowerCase();

    if (!effectiveUrl) {
      // still loading or failed
      return <p className="text-sm text-slate-500">No preview available yet.</p>;
    }

    // Images
    if (fileType.label === 'Image' || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext)) {
      const src = blobUrl || effectiveUrl;
      return (
        <img
          src={src}
          alt={file.name}
          className="max-h-[70vh] w-auto rounded-md object-contain"
          onLoad={() => { setLoaded(true); setLoading(false); }}
          onError={() => { setEmbedFailed(true); setLoading(false); }}
        />
      );
    }

    // Video
    if (fileType.label === 'Video' || ['mp4', 'webm', 'ogg'].includes(ext)) {
      const src = blobUrl || effectiveUrl;
      return (
        <video controls className="max-h-[70vh] w-full rounded-md bg-black" onLoadedData={() => { setLoaded(true); setLoading(false); }} onError={() => { setEmbedFailed(true); setLoading(false); }}>
          <source src={src} />
          Your browser does not support the video tag.
        </video>
      );
    }

    // Audio
    if (fileType.label === 'Audio' || ['mp3', 'wav', 'ogg'].includes(ext)) {
      return <audio controls src={effectiveUrl} className="w-full" />;
    }

    // PDF - use iframe for now
    if (ext === 'pdf') {
      const src = blobUrl || effectiveUrl;
      return (
        <div>
          <iframe
            src={src}
            title={file.name}
            className="h-[70vh] w-full rounded-md"
            onLoad={() => { setLoaded(true); setLoading(false); }}
            onError={() => { setEmbedFailed(true); setLoading(false); }}
          />
          {!loaded && !blobUrl && (
            <p className="mt-3 text-sm text-slate-500">If the preview is blank the server may disallow embedding (X-Frame-Options). The viewer will try a fallback; use Open to view the file in a new tab.</p>
          )}
          {embedFailed && blobUrl && (
            <p className="mt-3 text-sm text-slate-500">Loaded via fallback blob URL. If the file is still blank, open in new tab.</p>
          )}
        </div>
      );
    }

    // Office docs - not embeddable via Google viewer when private. Show Open button.
    if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
      return (
        <div className="py-6 text-center">
          <p className="mb-4 text-sm text-slate-600">Inline preview is not available for this document type. Use Open to view it.</p>
          <OpenButton />
        </div>
      );
    }

    // Default: show a simple Open button that fetches via backend stream and opens blob
    return (
      <div className="py-6 text-center">
        <p className="mb-4 text-sm text-slate-600">No inline preview available for this file type.</p>
        <OpenButton />
      </div>
    );
  };

  // Open button: fetch backend stream with auth and open blob in new tab
  const OpenButton = () => {
    const handleOpen = async () => {
      try {
        if (!streamUrl) {
          console.warn('No stream URL available for open');
          return;
        }
        console.debug('OpenButton: opening streamUrl=', streamUrl, 'file.publicId=', file.publicId);
        console.log('Open action selected file.publicId:', file.publicId);
        let headers = {};
        try {
          const token = await getToken();
          if (token) headers.Authorization = `Bearer ${token}`;
        } catch (error) {
          console.debug('FilePreviewModal: open auth token failed', error);
        }

        const res = await fetch(streamUrl, { headers });
        if (!res.ok) {
          console.error('Open fetch failed', res.status);
          return;
        }
        const blob = await res.blob();
        const bUrl = URL.createObjectURL(blob);
        // open in new tab
        window.open(bUrl, '_blank');
      } catch (err) {
        console.error('Open failed', err);
      }
    };

    return (
      <button onClick={handleOpen} className="btn-primary inline-flex items-center gap-2">
        <Download size={16} />
        Open
      </button>
    );
  };

  if (!file) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideFooter={true} width="max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 truncate">{file.name}</h3>
          <p className="text-xs text-slate-500">{fileType.label} • {file.size ? `${Math.round(file.size/1024)} KB` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={file.fileLocation} target="_blank" rel="noreferrer" title="Open in new tab" className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm">
            <Download size={14} />
            Open
          </a>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-center">
          {loading && (
            <div className="inline-flex items-center gap-2 text-sm text-slate-500">
              <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              Loading preview...
            </div>
          )}
        </div>
        {renderPreview()}
      </div>
    </Modal>
  );
};

export default FilePreviewModal;
