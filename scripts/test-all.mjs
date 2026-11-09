// Comando único de pruebas: ejecuta ambas suites, informa cada resultado y falla si alguna falla.
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import comprobarEntorno from '../backend/tests/support/guard.js'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PAQUETES = ['backend', 'frontend']

try {
  await comprobarEntorno()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

const resultados = PAQUETES.map((paquete) => {
  console.log(`\n=== Pruebas de ${paquete} ===`)
  const { status } = spawnSync('npm', ['test'], {
    cwd: path.join(RAIZ, paquete),
    stdio: 'inherit',
    shell: true,
  })
  return { paquete, aprobado: status === 0 }
})

console.log('\n=== Resultado ===')
for (const { paquete, aprobado } of resultados) {
  console.log(`${paquete}: ${aprobado ? 'aprobó' : 'FALLÓ'}`)
}

process.exit(resultados.every(({ aprobado }) => aprobado) ? 0 : 1)
