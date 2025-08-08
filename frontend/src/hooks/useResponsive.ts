import { useState, useEffect } from 'react';
import TelegramWebApp from '../telegram';

export interface ResponsiveConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTelegramWebApp: boolean;
  screenWidth: number;
  screenHeight: number;
  isLandscape: boolean;
  isPortrait: boolean;
  isIPhone: boolean;
  isAndroid: boolean;
  isIOS: boolean;
}

export function useResponsive(): ResponsiveConfig {
  const [config, setConfig] = useState<ResponsiveConfig>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isTelegramWebApp: false,
    screenWidth: 0,
    screenHeight: 0,
    isLandscape: false,
    isPortrait: false,
    isIPhone: false,
    isAndroid: false,
    isIOS: false,
  });

  useEffect(() => {
    const telegramWebApp = TelegramWebApp.getInstance();
    
    function updateResponsiveConfig() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const userAgent = navigator.userAgent.toLowerCase();
      
      const isIPhone = /iphone|ipod|ipad/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      const isIOS = isIPhone || /ipad/.test(userAgent);
      
      // iPhone 13 dimensions: 390x844 (portrait), 844x390 (landscape)
      const isMobile = width <= 768 || isIPhone;
      const isTablet = width > 768 && width <= 1024;
      const isDesktop = width > 1024;
      const isLandscape = width > height;
      const isPortrait = height > width;
      
      // Force landscape mode for iPhone in Telegram Web App
      const forceLandscape = isIPhone && telegramWebApp.isTelegramWebApp();
      
              setConfig({
          isMobile,
          isTablet,
          isDesktop,
          isTelegramWebApp: telegramWebApp.isTelegramWebApp(),
          screenWidth: width,
          screenHeight: height,
          isLandscape: forceLandscape ? true : isLandscape,
          isPortrait: forceLandscape ? false : isPortrait,
          isIPhone,
          isAndroid,
          isIOS,
        });
    }

    // Initial update
    updateResponsiveConfig();

    // Update on resize
    window.addEventListener('resize', updateResponsiveConfig);
    window.addEventListener('orientationchange', updateResponsiveConfig);

    // Update on Telegram Web App viewport change
    if (telegramWebApp.isTelegramWebApp()) {
      window.Telegram?.WebApp?.onEvent('viewportChanged', updateResponsiveConfig);
    }

    return () => {
      window.removeEventListener('resize', updateResponsiveConfig);
      window.removeEventListener('orientationchange', updateResponsiveConfig);
      if (telegramWebApp.isTelegramWebApp()) {
        window.Telegram?.WebApp?.offEvent('viewportChanged', updateResponsiveConfig);
      }
    };
  }, []);

  return config;
}

// Utility functions for responsive design
export const getResponsiveStyles = (config: ResponsiveConfig) => {
  const { isMobile, isTablet, isTelegramWebApp, isLandscape, isIPhone } = config;
  
  return {
    // Navigation styles
    nav: {
      height: isMobile ? 60 : 70,
      padding: isMobile ? '0 16px' : '0 32px',
      fontSize: isMobile ? 14 : 16,
      gap: isMobile ? 4 : 8,
    },
    
    // Container styles
    container: {
      maxWidth: isMobile ? '100%' : 1200,
      padding: isMobile ? (isLandscape ? '10px 20px' : '20px 16px') : '40px 32px',
      margin: '0 auto',
    },
    
    // Card styles
    card: {
      padding: isMobile ? 16 : 24,
      borderRadius: isMobile ? 12 : 16,
      gap: isMobile ? 12 : 24,
    },
    
    // Ball card styles
    ballCard: {
      minWidth: isMobile ? (isLandscape ? 140 : 160) : 220,
      padding: isMobile ? (isLandscape ? 16 : 20) : 32,
      gap: isMobile ? (isLandscape ? 8 : 12) : 32,
    },
    
    // Typography
    title: {
      fontSize: isMobile ? (isLandscape ? 24 : 32) : 48,
      marginBottom: isMobile ? (isLandscape ? 16 : 24) : 40,
    },
    
    subtitle: {
      fontSize: isMobile ? 18 : 24,
      marginBottom: isMobile ? 16 : 24,
    },
    
    // Button styles
    button: {
      padding: isMobile ? '10px 16px' : '12px 20px',
      fontSize: isMobile ? 14 : 16,
      borderRadius: isMobile ? 8 : 12,
    },
    
    // Modal styles
    modal: {
      width: isMobile ? '90%' : '500px',
      maxWidth: isMobile ? '350px' : '500px',
      padding: isMobile ? 20 : 32,
    },
    
    // Grid layouts
    grid: {
      columns: isMobile ? (isLandscape ? 4 : 1) : isTablet ? 2 : 3,
      gap: isMobile ? (isLandscape ? 8 : 16) : 24,
    },
  };
}; 