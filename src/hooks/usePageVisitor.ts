import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
        const sessionId = getSessionId();
        
        // Log to Supabase (detailed tracking)
        await supabase.from('page_visitors').insert({
          page_path: location.pathname,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
          session_id: sessionId,
        });
        
        // Log to AWS API (analytics aggregation)
        await recordVisit();
        
        console.log('Page visit logged to both systems:', location.pathname);
      } catch (error) {
        console.error('Error logging page visit:', error);
      }
    };

    logVisit();
  }, [location.pathname]);
};
