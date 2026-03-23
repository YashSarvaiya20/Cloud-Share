import React, { useState } from "react";
import Modal from "./Modal";
import { Copy, Check, X } from "lucide-react";

const LinkShareModal = ({
  isOpen,
  onClose,
  shareUrl,
  title = "Share File",
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!shareUrl) return;

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      hideFooter   // 👈 KEY LINE (prevents Cancel / Confirm)
      width="max-w-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">{title}</h2>

        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-500 mb-4">
        Share this link with others to give them access to this file.
      </p>

      {/* Link Input */}
      <div className="relative mb-2">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="w-full rounded-lg border px-3 py-2 pr-10 text-sm text-gray-700
                     focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <button
          onClick={handleCopy}
          className="absolute right-2 top-1/2 -translate-y-1/2
                     text-gray-500 hover:text-purple-600"
          title="Copy link"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-6">
        Anyone with this link can access this file.
      </p>

      {/* Footer (Custom) */}
      <div className="flex justify-end gap-3 border-t pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-md border text-sm
                     text-gray-600 hover:bg-gray-100"
        >
          Close
        </button>

        <button
          onClick={handleCopy}
          className="px-4 py-2 rounded-md bg-purple-600 text-sm
                     text-white hover:bg-purple-700"
        >
          Copy
        </button>
      </div>
    </Modal>
  );
};

export default LinkShareModal;
