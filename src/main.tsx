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

// Ensure proper mobile viewport
const viewport = document.querySelector('meta[name=viewport]');
if (viewport) {
  viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
}

createRoot(document.getElementById("root")!).render(<App />);
