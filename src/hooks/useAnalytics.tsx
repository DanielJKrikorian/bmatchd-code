import { createContext, useContext, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (
      type: string,
      action: string,
      params?: {
        page_path?: string;
        page_title?: string;
        [key: string]: any;
      }
    ) => void;
  }
}

type AnalyticsContextType = {
  trackEvent: (eventName: string, params?: { [key: string]: any }) => void;
};

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_title: document.title
    });
  }, [location]);

  const trackEvent = useCallback((eventName: string, params?: { [key: string]: any }) => {
    window.gtag('event', eventName, params);
  }, []);

  return (
    <AnalyticsContext.Provider value={{ trackEvent }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};