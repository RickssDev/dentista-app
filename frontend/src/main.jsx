import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.jsx'
import "@fontsource-variable/jost";

// El inicio de sesión con Google se monta solo en el login (spec 023): las demás páginas no cargan su script
const contenedor = document.getElementById('root')
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Las páginas públicas y el login llegan prerenderizados (specs 022 y 023): se hidratan en lugar de
// repintarse. Las demás privadas reciben el armazón vacío (app.html) y se pintan desde cero.
if (contenedor.hasChildNodes()) {
  hydrateRoot(contenedor, app)
} else {
  createRoot(contenedor).render(app)
}
