import { useEffect, useState, useCallback } from "react";
import API_BASE_URL from "../config";

export function useAdminLive(token, onOrderUpdate) {
  const [presence, setPresence] = useState({ onlineCount: 0, users: [] });

  const handlePresence = useCallback((data) => {
    setPresence({
      onlineCount: data.onlineCount ?? 0,
      users: data.users || [],
    });
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    const url = `${API_BASE_URL}/api/events/admin?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url);

    eventSource.addEventListener("presence", (e) => {
      try {
        handlePresence(JSON.parse(e.data));
      } catch {
        /* ignore */
      }
    });

    eventSource.addEventListener("order", () => {
      onOrderUpdate?.();
    });

    return () => {
      eventSource.close();
    };
  }, [token, handlePresence, onOrderUpdate]);

  const isUserOnline = useCallback(
    (userId) => presence.users.some((u) => String(u.id) === String(userId)),
    [presence.users]
  );

  return { presence, isUserOnline };
}
