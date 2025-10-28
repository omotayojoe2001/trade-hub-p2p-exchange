// Fix mobile scroll with frozen bottom nav
export const enableMobileScroll = () => {
  const isMobileApp = !!(window as any).Capacitor || 
                     window.navigator.standalone || 
                     window.matchMedia('(display-mode: standalone)').matches ||
                     /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobileApp) {
    // Fix the scroll container architecture
    const fixScrollArchitecture = () => {
      // Ensure body and html can scroll
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100vh';
      
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      
      // Fix root container
      const root = document.getElementById('root');
      if (root) {
        root.style.height = '100vh';
        root.style.overflow = 'hidden';
        root.style.display = 'flex';
        root.style.flexDirection = 'column';
      }
      
      // Fix mobile container
      const mobileContainer = document.querySelector('.mobile-container') as HTMLElement;
      if (mobileContainer) {
        mobileContainer.style.height = '100vh';
        mobileContainer.style.display = 'flex';
        mobileContainer.style.flexDirection = 'column';
        mobileContainer.style.overflow = 'hidden';
      }
      
      // Fix page content to be scrollable
      const pageContent = document.querySelector('.page-content') as HTMLElement;
      if (pageContent) {
        pageContent.style.flex = '1';
        pageContent.style.overflowY = 'auto';
        pageContent.style.overflowX = 'hidden';
        pageContent.style.webkitOverflowScrolling = 'touch';
        pageContent.style.height = 'calc(100vh - 70px)';
      }
      
      // Ensure bottom nav stays fixed
      const bottomNav = document.querySelector('.bottom-nav') as HTMLElement;
      if (bottomNav) {
        bottomNav.style.position = 'fixed';
        bottomNav.style.bottom = '0';
        bottomNav.style.left = '0';
        bottomNav.style.right = '0';
        bottomNav.style.zIndex = '99999';
        bottomNav.style.height = '70px';
        bottomNav.style.touchAction = 'none';
      }
    };
    
    // Apply fixes
    fixScrollArchitecture();
    setTimeout(fixScrollArchitecture, 100);
    setTimeout(fixScrollArchitecture, 500);
    
    // Re-apply on DOM changes
    const observer = new MutationObserver(() => {
      setTimeout(fixScrollArchitecture, 50);
    });
    
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }
};

// Initialize scroll fixes
if (typeof document !== 'undefined') {
  enableMobileScroll();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableMobileScroll);
  }
  
  // Re-run on route changes
  window.addEventListener('popstate', enableMobileScroll);
  
  // Periodic fixes for mobile apps
  setInterval(enableMobileScroll, 2000);
}