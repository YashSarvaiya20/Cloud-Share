import React, { useEffect } from "react";

const Modal = ({
  isOpen,
  onClose,
  onConfirm,
  children,
  title,
  confirmText = "Confirm",
  cancelText = "Cancel",
  width = "max-w-md",
  size,
  confirmationButtonClass,

  // 👇 NEW (default false)
  hideFooter = false,
}) => {
  const resolvedWidth = size === "sm" ? "max-w-sm" : width;

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative z-10 mx-4 w-full overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.5)] backdrop-blur ${resolvedWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Body */}
        <div className="p-6">
          {title ? <h3 className="mb-3 text-lg font-semibold text-slate-900">{title}</h3> : null}
          {children}
        </div>

        {/* Footer */}
        {!hideFooter && (
          <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              {cancelText}
            </button>

            <button
              onClick={onConfirm}
              className={confirmationButtonClass ? `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 ${confirmationButtonClass}` : "btn-primary"}
            >
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
