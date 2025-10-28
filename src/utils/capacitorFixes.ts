// Mobile app scroll fixes
export const initCapacitorFixes = () => {
  const isCapacitor = !!(window as any).Capacitor;
  const isMobileApp = isCapacitor || window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  
  if (isMobileApp) {
    // Remove all scroll restrictions
    document.documentElement.style.overflow = 'visible';
    document.documentElement.style.overflowY = 'visible';
    document.documentElement.style.height = 'auto';
    
    document.body.style.overflow = 'visible';
    document.body.style.overflowY = 'visible';
    document.body.style.height = 'auto';
    document.body.style.minHeight = '100vh';
    document.body.style.webkitOverflowScrolling = 'touch';
    document.body.style.touchAction = 'auto';
    
    // Fix root container
    const root = document.getElementById('root');
    if (root) {
      root.style.overflow = 'visible';
      root.style.overflowY = 'visible';
      root.style.height = 'auto';
      root.style.minHeight = '100vh';
    }
    
    // Remove any scroll blocking
    const removeScrollBlocks = () => {
      const elements = document.querySelectorAll('*');
      elements.forEach((el: any) => {
        if (el.style.overflowY === 'hidden' && !el.classList.contains('bottom-nav')) {
          el.style.overflowY = 'visible';
        }
        if (el.style.height === '100vh' && !el.classList.contains('bottom-nav')) {
          el.style.height = 'auto';
          el.style.minHeight = '100vh';
        }
      });
    };
    
    removeScrollBlocks();
    setTimeout(removeScrollBlocks, 500);
    
    // Force scroll reset on touch
    let touchStartY = 0;
    document.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
      const touchY = e.touches[0].clientY;
      const touchDiff = touchStartY - touchY;
      
      // Allow natural scrolling
      if (Math.abs(touchDiff) > 5) {
        window.scrollBy(0, touchDiff * 0.5);
      }
    }, { passive: true });
  }
};

// Initialize immediately and repeatedly
if (typeof document !== 'undefined') {
  initCapacitorFixes();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCapacitorFixes);
  }
  
  // Re-run fixes periodically for mobile apps
  setInterval(initCapacitorFixes, 2000);
  
  // Re-run on route changes
  window.addEventListener('popstate', initCapacitorFixes);
  window.addEventListener('pushstate', initCapacitorFixes);
}