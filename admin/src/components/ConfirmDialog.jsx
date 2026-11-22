import { useEffect, useRef } from "react";

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "primary",
  busy = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    confirmRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="modal modal-open" role="presentation">
      <div
        className="modal-box max-w-md"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
      >
        <h3 id="confirm-title" className="text-lg font-bold">
          {title}
        </h3>
        <p id="confirm-description" className="mt-2 text-sm text-base-content/70">
          {description}
        </p>
        <div className="modal-action">
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`btn btn-${tone}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy && <span className="loading loading-spinner loading-xs" />}
            {confirmLabel}
          </button>
        </div>
      </div>
      <button type="button" className="modal-backdrop" onClick={onCancel} aria-label="Close dialog" />
    </div>
  );
}

export default ConfirmDialog;
