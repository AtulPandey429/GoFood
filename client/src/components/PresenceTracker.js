import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import API_BASE_URL from "../config";

/** Keeps a live SSE connection so the server can track this user as online. */
const PresenceTracker = () => {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return undefined;

    const url = `${API_BASE_URL}/api/events/presence?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url);

    return () => {
      eventSource.close();
    };
  }, [token]);

  return null;
};

export default PresenceTracker;
