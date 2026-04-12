import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const NotificationContext = createContext({ pendingCount: 0, dismissed: false, dismiss: () => {}, refresh: () => {} });

export function NotificationProvider({ children }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const checkPending = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/reminders/pending`);
      const count = res.data.length;
      setPendingCount(count);

      if (count > 0 && "Notification" in window && Notification.permission === "granted") {
        new Notification("PlantaScan", {
          body: `Voce tem ${count} lembrete${count > 1 ? "s" : ""} pendente${count > 1 ? "s" : ""}!`,
          tag: "plantascan-reminder",
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    checkPending();
    const interval = setInterval(checkPending, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkPending]);

  const dismiss = () => setDismissed(true);
  const refresh = () => { setDismissed(false); checkPending(); };

  return (
    <NotificationContext.Provider value={{ pendingCount, dismissed, dismiss, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
