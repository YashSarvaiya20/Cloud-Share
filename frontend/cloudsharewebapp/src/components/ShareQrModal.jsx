import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import { Copy, Download, Link2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import apiEndpoint from '../util/apiEndpoint';
import { useAuth } from '@clerk/clerk-react';

const ShareQrModal = ({ isOpen, onClose, fileId, fileName, shareUrl: initialShareUrl }) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const absoluteShareUrl = useMemo(() => {
    const relative = shareData?.shareUrl || initialShareUrl || '';
    if (!relative) return '';
    return relative.startsWith('http') ? relative : `${window.location.origin}${relative}`;
  }, [initialShareUrl, shareData?.shareUrl]);

  useEffect(() => {
    if (!isOpen) return;
    if (!fileId && initialShareUrl) {
      setShareData({ shareUrl: initialShareUrl });
      setError('');
      return;
    }

    const createShare = async () => {
      if (!fileId) return;
      setLoading(true);
      setError('');
      try {
        const token = await getToken();
        const response = await axios.post(apiEndpoint.SHARE_CREATE, {
          fileId,
          expiryDuration: '24h',
        }, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setShareData(response.data);
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to create QR share link right now.');
      } finally {
        setLoading(false);
      }
    };

    createShare();
  }, [fileId, getToken, initialShareUrl, isOpen]);

  const handleCopy = async () => {
    if (!absoluteShareUrl) return;
    await navigator.clipboard.writeText(absoluteShareUrl);
    setCopied(true);
    toast.success('Share link copied');
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    const canvas = document.getElementById('share-qr-canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${(fileName || 'cloudshare').replace(/\s+/g, '-').toLowerCase()}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideFooter width="max-w-lg">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">QR Share</h3>
          <p className="text-sm text-slate-500">{fileName || 'Shared file'}</p>
        </div>
        <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
        {loading ? (
          <div className="rounded-2xl bg-slate-100 px-6 py-10 text-center text-sm text-slate-500">Generating QR share link...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-700">{error}</div>
        ) : absoluteShareUrl ? (
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="rounded-3xl bg-slate-50 p-4 shadow-inner">
              <QRCodeCanvas id="share-qr-canvas" value={absoluteShareUrl} size={220} includeMargin bgColor="#ffffff" fgColor="#0f172a" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Scan to open the shared file page</p>
              <p className="mt-1 text-xs text-slate-500">This QR opens the expiring share link directly.</p>
            </div>
            <div className="flex w-full flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2 truncate text-xs text-slate-500">
                <Link2 size={14} />
                <span className="truncate">{absoluteShareUrl}</span>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={handleCopy} className="btn-secondary">
                  <Copy size={16} />
                  {copied ? 'Copied' : 'Copy Link'}
                </button>
                <button onClick={handleDownload} className="btn-primary">
                  <Download size={16} />
                  Download QR
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-100 px-6 py-10 text-center text-sm text-slate-500">No share link is available yet.</div>
        )}
      </div>
    </Modal>
  );
};

export default ShareQrModal;
