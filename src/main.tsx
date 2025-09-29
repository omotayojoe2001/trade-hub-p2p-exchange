import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/global-ui-improvements.css'
import './styles/specific-fixes.css'
import './styles/remove-animations.css'

createRoot(document.getElementById("root")!).render(<App />);
