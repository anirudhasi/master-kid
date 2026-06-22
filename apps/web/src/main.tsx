import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import '@/index.css'
import { useAuthStore } from '@/store/authStore'

// Reconcile persisted auth with the real backend session before/while rendering.
void useAuthStore.getState().init()

// v3 — forces new bundle hash to clear poisoned CDN cache
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
