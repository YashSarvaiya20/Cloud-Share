import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import React from 'react'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { ThemeProvider } from './context/ThemeContext.jsx'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
createRoot(document.getElementById('root')).render(
  <ClerkProvider publishableKey={clerkPubKey}>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </ClerkProvider>
    
  
)
