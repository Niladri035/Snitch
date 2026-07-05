import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.jsx'
import { Provider } from 'react-redux'
import {store} from "./app/app.store.js"

// Automatically direct all relative /api fetch calls to the Render backend in production
const backendBase = import.meta.env.VITE_API_BASE_URL || '';
if (backendBase) {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string' && input.startsWith('/api')) {
      input = `${backendBase}${input}`;
    }
    return originalFetch(input, init);
  };
}



createRoot(document.getElementById('root')).render(
<Provider store={store}>
    <App />
</Provider>

)
