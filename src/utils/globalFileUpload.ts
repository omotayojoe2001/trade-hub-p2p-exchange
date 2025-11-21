// Global utility to replace all native file inputs with InAppPhotoPicker
export const replaceNativeFileInputs = () => {
  // Find all file inputs and replace them
  const fileInputs = document.querySelectorAll('input[type="file"]');
  
  fileInputs.forEach((input) => {
    const htmlInput = input as HTMLInputElement;
    
    // Skip if already replaced
    if (htmlInput.dataset.replaced === 'true') return;
    
    // Mark as replaced
    htmlInput.dataset.replaced = 'true';
    
    // Hide the native input
    htmlInput.style.display = 'none';
    
    // Create replacement button
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50';
    button.innerHTML = `
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
      </svg>
      Choose File
    `;
    
    // Insert button after the input
    htmlInput.parentNode?.insertBefore(button, htmlInput.nextSibling);
    
    // Add click handler to trigger InAppPhotoPicker
    button.addEventListener('click', () => {
      // Dispatch custom event that components can listen to
      window.dispatchEvent(new CustomEvent('openInAppPhotoPicker', {
        detail: { 
          inputElement: htmlInput,
          accept: htmlInput.accept || 'image/*,application/pdf'
        }
      }));
    });
  });
};

// Auto-replace on DOM changes
const observer = new MutationObserver(() => {
  replaceNativeFileInputs();
});

// Start observing
if (typeof document !== 'undefined') {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Initial replacement
  document.addEventListener('DOMContentLoaded', replaceNativeFileInputs);
  setTimeout(replaceNativeFileInputs, 100);
}