
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    server: {
      // En desarrollo, /api se reenvía al API Gateway.
      proxy: {
        '/api': {
          target: env.VITE_PROXY_DESTINO || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },

    test: {
      environment: 'jsdom',
      env: {
        VITE_MODO_DATOS: 'local',
      },
      globals: true,
      setupFiles: './src/test/setup.js',

      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        // Solo se mide lo que decidimos probar.
        include: [
          'src/domain/**/*.js',
          'src/services/**/*.js',
          'src/auth/**/*.js',
          'src/api/{cliente,errores}.js',
          'src/config/permisos.js',
          'src/context/SesionContext.jsx',
          'src/data/db.js',
          'src/components/{TarjetaServicio,ListaServicios,FormularioLogin,Navbar,RutaProtegida}.jsx',
          'src/pages/Especialistas.jsx',
        ],
      },
    },
  }
})
