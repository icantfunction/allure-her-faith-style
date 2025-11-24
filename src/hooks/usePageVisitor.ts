import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { recordVisit } from '@/api/allureherApi';

// Generate or retrieve session ID
const getSessionId = (): string => {
  const storageKey = 'visitor_session_id';
  let sessionId = sessionStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
};

export const usePageVisitor = () => {
  const location = useLocation();

  useEffect(() => {
    const logVisit = async () => {
      try {
        // Log to AWS API (analytics aggregation)
        await recordVisit();
      } catch (error) {
        // Silently fail - analytics should not impact user experience
        // Error already handled in recordVisit function
      }
    };

    logVisit();
  }, [location.pathname]);
};
