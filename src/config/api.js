// Conexión con el backend. Los valores vienen de las variables de entorno de Vite (ver .env.example).

// URL base del API Gateway. Con el proxy de Vite en desarrollo basta con la ruta relativa.
export const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

// 'local': la app usa los datos guardados en el navegador (sirve mientras el backend no está listo).
// 'api': todas las operaciones van a los microservicios Spring Boot por HTTP.
export const MODO_DATOS = import.meta.env.VITE_MODO_DATOS === 'api' ? 'api' : 'local'
export const usaApi = () => MODO_DATOS === 'api'

// Tiempo máximo de espera por respuesta del servidor.
export const TIEMPO_ESPERA_MS = 10000

// El token de acceso se renueva un minuto antes de vencer, para que el usuario no note el cambio.
export const RENOVAR_ANTES_MS = 60 * 1000
