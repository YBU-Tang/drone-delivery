import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

let notifId = 0;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const notify = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++notifId;
    setNotifications((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notify, dismiss }}>
      {children}
      <NotificationToast notifications={notifications} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}

function NotificationToast({ notifications, onDismiss }) {
  if (notifications.length === 0) return null;
  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-orange-500',
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`${bgColors[n.type] || bgColors.info} text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-3 pointer-events-auto`}
          style={{ animation: 'slideIn 0.3s ease-out' }}
        >
          <span className="text-sm font-medium">{n.message}</span>
          <button onClick={() => onDismiss(n.id)} className="text-white/80 hover:text-white text-lg leading-none">×</button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
