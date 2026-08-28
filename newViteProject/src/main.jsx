import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import City from './first1.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <City />
  </StrictMode>,
)
