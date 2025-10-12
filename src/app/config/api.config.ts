import { environment } from '../../environments/environment';

export const API_CONFIG = {
  // URL base de la API
  baseUrl: environment.apiUrl,
  
  // Endpoints de autenticación
  endpoints: {
    authenticate: '/Usuarios/authenticate',
    refreshToken: '/Usuarios/refresh-token',
    revokeToken: '/Usuarios/revoke-token',
    register: '/Usuarios/register',
    forgotPassword: '/Usuarios/forgot-password',
    resetPassword: '/Usuarios/reset-password',
    verifyEmail: '/Usuarios/verify-email',
    changeLanguage: '/Usuarios/change-language'
  },
  
  // Configuración de timeouts
  timeouts: {
    default: environment.timeout,
    auth: 10000, // 10 segundos para autenticación
    refresh: 5000 // 5 segundos para refresh token
  },
  
  // Configuración de reintentos
  retry: {
    attempts: environment.retryAttempts,
    delay: 1000 // 1 segundo entre reintentos
  },
  
  // Headers por defecto
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // URLs públicas que no requieren autenticación
  publicUrls: [
    '/authenticate',
    '/refresh-token',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email'
  ]
};

/**
 * Construye la URL completa para un endpoint
 */
export function buildApiUrl(endpoint: string): string {
  return `${API_CONFIG.baseUrl}${endpoint}`;
}

/**
 * Verifica si una URL es pública (no requiere autenticación)
 */
export function isPublicUrl(url: string): boolean {
  return API_CONFIG.publicUrls.some(publicUrl => url.includes(publicUrl));
}

/**
 * Verifica si una URL pertenece a nuestra API
 */
export function isApiUrl(url: string): boolean {
  const isApi = url.startsWith(API_CONFIG.baseUrl);
  console.log('isApiUrl: URL:', url);
  console.log('isApiUrl: baseUrl:', API_CONFIG.baseUrl);
  console.log('isApiUrl: Resultado:', isApi);
  return isApi;
}
