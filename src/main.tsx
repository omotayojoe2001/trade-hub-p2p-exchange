import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/global-ui-improvements.css'
import './styles/specific-fixes.css'
import './styles/remove-animations.css'
import './styles/dialog-fixes.css'
import './utils/preventZoom'
import './utils/capacitorFixes'
import './utils/mobileScrollFix'
import './utils/globalFileUpload'

// Ensure proper mobile viewport
const viewport = document.querySelector('meta[name=viewport]');
if (viewport) {
  viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
}

// Global InAppPhotoPicker handler
let globalPhotoPicker: any = null;

window.addEventListener('openInAppPhotoPicker', (event: any) => {
  const { inputElement, accept } = event.detail;
  
  // Create and show picker
  if (!globalPhotoPicker) {
    const pickerDiv = document.createElement('div');
    pickerDiv.id = 'global-photo-picker';
    document.body.appendChild(pickerDiv);
    
    // Import and render InAppPhotoPicker
    import('./components/ui/InAppPhotoPicker').then(({ InAppPhotoPicker }) => {
      import('react-dom/client').then(({ createRoot }) => {
        import('react').then((React) => {
          const root = createRoot(pickerDiv);
          
          const handleSelect = (file: File) => {
            // Trigger change event on original input
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            inputElement.files = dataTransfer.files;
            
            const changeEvent = new Event('change', { bubbles: true });
            inputElement.dispatchEvent(changeEvent);
            
            // Close picker
            root.unmount();
            pickerDiv.remove();
            globalPhotoPicker = null;
          };
          
          const handleClose = () => {
            root.unmount();
            pickerDiv.remove();
            globalPhotoPicker = null;
          };
          
          root.render(React.createElement(InAppPhotoPicker, {
            isOpen: true,
            onClose: handleClose,
            onSelect: handleSelect,
            title: 'Select File'
          }));
          
          globalPhotoPicker = root;
        });
      });
    });
  }
});

createRoot(document.getElementById("root")!).render(<App />);
