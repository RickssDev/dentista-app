// Ayudante de pruebas (spec 022): prerenderiza rutas en un proceso aparte, como el build, y escribe el
// HTML de cada una como JSON en la salida. Así la prueba de hidratación no comparte React ni React
// Router con el render del servidor (en el mismo proceso, su contexto se cuela en el del cliente).
// Uso: node tests/support/prerenderizar.mjs / /nosotros …   (desde frontend/)
import { createServer } from 'vite'

const servidor = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
})

try {
  const { render } = await servidor.ssrLoadModule('/src/entry-prerender.jsx')
  const paginas = {}
  for (const ruta of process.argv.slice(2)) paginas[ruta] = await render(ruta)
  process.stdout.write(JSON.stringify(paginas))
} finally {
  await servidor.close()
}
