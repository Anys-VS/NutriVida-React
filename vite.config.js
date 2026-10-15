import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Solo se mide lo que decidimos probar: lógica de negocio, datos y
      // los componentes con comportamiento. Vistas estáticas y estilos quedan fuera.
      include: [
        'src/domain/**/*.js',
        'src/services/**/*.js',
        'src/data/db.js',
        'src/components/{TarjetaServicio,ListaServicios,FormularioLogin}.jsx',
      ],
    },
  },
})
