// Capacitor-specific fixes for mobile app
export const initCapacitorFixes = () => {
  // Check if running in Capacitor
  const isCapacitor = !!(window as any).Capacitor;
  
  if (isCapacitor) {
    // Fix scroll issues in Capacitor
    document.body.style.overflowY = 'scroll';
    document.documentElement.style.overflowY = 'scroll';
    
    // Enable momentum scrolling
    document.body.style.webkitOverflowScrolling = 'touch';
    
    // Fix touch action for scrolling
    document.body.style.touchAction = 'pan-y';
    
    // Prevent scroll bounce
    document.addEventListener('touchmove', (e) => {
      // Allow scrolling on the main content
      const target = e.target as HTMLElement;
      if (target.closest('.page-content') || target.closest('.mobile-safe')) {
        return;
      }
      // Prevent bounce on other elements
      e.preventDefault();
    }, { passive: false });
    
    // Force scroll container setup
    const setupScrollContainer = () => {
      const root = document.getElementById('root');
      if (root) {
        root.style.height = '100vh';
        root.style.overflowY = 'scroll';
        root.style.webkitOverflowScrolling = 'touch';
      }
    };
    
    // Setup immediately and after DOM changes
    setupScrollContainer();
    setTimeout(setupScrollContainer, 100);
    
    // Handle keyboard events that might affect scrolling
    document.addEventListener('keyboardWillShow', () => {
      document.body.style.height = 'auto';
    });
    
    document.addEventListener('keyboardWillHide', () => {
      document.body.style.height = '100vh';
    });
  }
};

// Initialize on load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCapacitorFixes);
  } else {
    initCapacitorFixes();
  }
}