import React, { useState, useEffect } from 'react';

// Singleton toast event bus
let addToastHandler = null;

export const toast = {
  success: (title, message, options = {}) => {
    if (addToastHandler) {
      addToastHandler({
        id: Date.now() + Math.random(),
        type: 'success',
        title,
        message,
        duration: options.duration || 6000,
        action: options.action
      });
    }
  },
  error: (title, message, options = {}) => {
    if (addToastHandler) {
      addToastHandler({
        id: Date.now() + Math.random(),
        type: 'error',
        title,
        message,
        duration: options.duration || 6000,
        action: options.action
      });
    }
  },
  info: (title, message, options = {}) => {
    if (addToastHandler) {
      addToastHandler({
        id: Date.now() + Math.random(),
        type: 'info',
        title,
        message,
        duration: options.duration || 5000,
        action: options.action
      });
    }
  }
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastHandler = (newToast) => {
      setToasts((prev) => [...prev, newToast]);

      if (newToast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, newToast.duration);
      }
    };

    return () => {
      addToastHandler = null;
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="synapz-toast-portal" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`synapz-toast-item toast-${t.type}`} role="alert">
          <div className="toast-icon-wrap">
            {t.type === 'success' && '✓'}
            {t.type === 'error' && '⚠️'}
            {t.type === 'info' && 'ℹ️'}
          </div>

          <div className="toast-body">
            {t.title && <div className="toast-title">{t.title}</div>}
            {t.message && <div className="toast-message">{t.message}</div>}
            {t.action && (
              <button
                type="button"
                className="toast-action-btn"
                onClick={() => {
                  t.action.onClick();
                  removeToast(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>

          <button
            type="button"
            className="toast-dismiss-btn"
            onClick={() => removeToast(t.id)}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
