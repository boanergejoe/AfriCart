import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2Icon, CircleAlertIcon, InfoIcon, XIcon } from "lucide-react";
import { ToastContext } from "../lib/toast";

const TOAST_STYLES = {
  success: { icon: CheckCircle2Icon, className: "alert-success" },
  error: { icon: CircleAlertIcon, className: "alert-error" },
  info: { icon: InfoIcon, className: "alert-info" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeouts = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    clearTimeout(timeouts.current.get(id));
    timeouts.current.delete(id);
  }, []);

  const notify = useCallback(
    (message, tone = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((current) => [...current.slice(-2), { id, message, tone }]);
      timeouts.current.set(id, setTimeout(() => dismiss(id), 4500));
    },
    [dismiss]
  );

  useEffect(() => {
    const pending = timeouts.current;
    return () => pending.forEach((timeout) => clearTimeout(timeout));
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast toast-top toast-end z-50" aria-live="polite">
        {toasts.map((toast) => {
          const { icon: Icon, className } = TOAST_STYLES[toast.tone] || TOAST_STYLES.info;
          return (
            <div key={toast.id} className={`alert shadow-lg ${className}`} role="status">
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span className="text-sm">{toast.message}</span>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
