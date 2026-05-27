import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { Check, Copy, Link2, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import apiEndpoint from '../util/apiEndpoint';
import { useAuth } from '@clerk/clerk-react';

const EXPIRY_OPTIONS = [
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
];

const LinkShareModal = ({
  isOpen,
  onClose,
  shareUrl,
  fileId,
  fileName,
  title = 'Share File',
}) => {
  const { getToken } = useAuth();
  const [copied, setCopied] = useState(false);
  const [selectedExpiry, setSelectedExpiry] = useState('24h');
  const [loading, setLoading] = useState(false);
  const [shareData, setShareData] = useState(null);

  const generatedShareUrl = useMemo(() => {
    const relativeUrl = shareData?.shareUrl || shareUrl || '';
    if (!relativeUrl) return '';
    return relativeUrl.startsWith('http') ? relativeUrl : `${window.location.origin}${relativeUrl}`;
  }, [shareData?.shareUrl, shareUrl]);

  const handleGenerate = async () => {
    if (!fileId) return;
    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.post(apiEndpoint.SHARE_CREATE, {
        fileId,
        expiryDuration: selectedExpiry,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setShareData(response.data);
      toast.success('Temporary link created');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to create temporary share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const targetUrl = generatedShareUrl;
    if (!targetUrl) return;

    await navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    toast.success('Share link copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideFooter width="max-w-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{fileName || 'Share this file with an expiring public link.'}</p>
        </div>

        <button onClick={onClose} className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {fileId ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Expiry duration</label>
            <div className="flex flex-wrap gap-2">
              {EXPIRY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedExpiry(option.value)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${selectedExpiry === option.value ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button onClick={handleGenerate} disabled={loading} className="btn-primary mt-4 w-full">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
              {loading ? 'Creating link...' : 'Generate temporary share link'}
            </button>
          </div>
        ) : null}

        {generatedShareUrl ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Share link</label>
            <div className="relative">
              <input value={generatedShareUrl} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm text-slate-700 shadow-sm" />
              <button onClick={handleCopy} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600" title="Copy link">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            {shareData?.expiresAt ? (
              <p className="mt-3 text-xs text-slate-500">Expires on {new Date(shareData.expiresAt).toLocaleString()}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
        <button onClick={onClose} className="btn-secondary">Close</button>
        <button onClick={handleCopy} className="btn-primary" disabled={!generatedShareUrl}>
          Copy Link
        </button>
      </div>
    </Modal>
  );
};

export default LinkShareModal;
