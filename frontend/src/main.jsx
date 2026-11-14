import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.jsx'
import { GoogleOAuthProvider } from "@react-oauth/google";
import "@fontsource-variable/jost";

const contenedor = document.getElementById('root')
const app = (
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
  <StrictMode>
    <App />
  </StrictMode>
  </GoogleOAuthProvider>
)

// Las páginas públicas llegan prerenderizadas (spec 022): se hidratan en lugar de repintarse.
// Las privadas reciben el armazón vacío (app.html) y se pintan desde cero.
if (contenedor.hasChildNodes()) {
  hydrateRoot(contenedor, app)
} else {
  createRoot(contenedor).render(app)
}
