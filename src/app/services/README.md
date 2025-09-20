# Servicios de Autenticación

Este directorio contiene los servicios necesarios para manejar la autenticación en la aplicación Angular, integrados con la API de .NET.

## Archivos

### 1. `auth.service.ts`
Servicio principal de autenticación que maneja:
- Login para Profesorado (solo email, contraseña fija `123456`)
- Login para Administración (email y contraseña personalizada)
- Logout
- Refresh de tokens
- Gestión de estado del usuario
- Almacenamiento seguro de tokens

**Métodos principales:**
```typescript
// Login para profesores
loginProfesorado(email: string): Observable<LoginResponse>

// Login para administración
loginAdministracion(email: string, password: string, rememberMe?: boolean): Observable<LoginResponse>

// Logout
logout(): Observable<any>

// Verificar autenticación
isLoggedIn(): boolean

// Obtener usuario actual
currentUser: computed(() => User | null)

// Verificar roles
hasRole(role: string): boolean
isAdmin(): boolean
isProfesor(): boolean
isAdministracion(): boolean
```

### 2. `auth-monitor.service.ts`
Servicio de monitoreo que maneja:
- Estado global de autenticación
- Renovación automática de tokens
- Seguimiento de actividad del usuario
- Detección de inactividad
- Logout automático por expiración

**Características:**
- Renovación automática de tokens cada 50 minutos
- Verificación de validez cada 5 minutos
- Detección de inactividad del usuario
- Estado reactivo con signals de Angular

### 3. `auth.interceptor.ts`
Interceptor HTTP que:
- Agrega automáticamente el token JWT a las peticiones
- Maneja errores 401 (token expirado)
- Renueva tokens automáticamente
- Redirige al login en caso de error de autenticación

### 4. `auth.guard.ts`
Guard de autenticación que:
- Protege rutas que requieren autenticación
- Verifica roles específicos
- Verifica tipos de usuario
- Redirige a login si no está autenticado

**Uso en rutas:**
```typescript
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [AuthGuard],
  data: { 
    roles: ['Admin'],
    requiresAdmin: true 
  }
}
```

### 5. `login.guard.ts`
Guard para el login que:
- Redirige usuarios ya autenticados al dashboard
- Evita acceso innecesario a la página de login

## Uso en Componentes

### Inyección del servicio
```typescript
import { AuthService } from '../services/auth.service';
import { AuthMonitorService } from '../services/auth-monitor.service';

export class MyComponent {
  private authService = inject(AuthService);
  private authMonitorService = inject(AuthMonitorService);
  
  // Usar signals reactivos
  isAuthenticated = this.authMonitorService.isAuthenticated;
  currentUser = this.authMonitorService.currentUser;
}
```

### Login de Profesorado
```typescript
onProfesoradoLogin(email: string) {
  this.authService.loginProfesorado(email).subscribe({
    next: (response) => {
      console.log('Login exitoso:', response);
      this.router.navigate(['/dashboard']);
    },
    error: (error) => {
      console.error('Error de login:', error);
    }
  });
}
```

### Login de Administración
```typescript
onAdministracionLogin(email: string, password: string, rememberMe: boolean) {
  this.authService.loginAdministracion(email, password, rememberMe).subscribe({
    next: (response) => {
      console.log('Login exitoso:', response);
      this.router.navigate(['/dashboard']);
    },
    error: (error) => {
      console.error('Error de login:', error);
    }
  });
}
```

### Logout
```typescript
onLogout() {
  this.authMonitorService.logout();
}
```

### Verificar permisos
```typescript
// Verificar si es administrador
if (this.authMonitorService.isAdmin()) {
  // Mostrar opciones de administración
}

// Verificar rol específico
if (this.authMonitorService.hasRole('Admin')) {
  // Acceso de administrador
}

// Verificar tipo de usuario
if (this.authMonitorService.isProfesor()) {
  // Acceso de profesor
}
```

## Configuración

### 1. URL de la API
La URL de la API se configura en los archivos de environment:

**`src/environments/environment.ts` (desarrollo):**
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7001', // URL de la API .NET en desarrollo
  // ... otras configuraciones
};
```

**`src/environments/environment.prod.ts` (producción):**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-api-produccion.com', // URL de la API .NET en producción
  // ... otras configuraciones
};
```

### 2. Configuración centralizada
La configuración de la API está centralizada en `src/app/config/api.config.ts`:
```typescript
export const API_CONFIG = {
  baseUrl: environment.apiUrl,
  endpoints: {
    authenticate: '/Usuarios/authenticate',
    refreshToken: '/Usuarios/refresh-token',
    // ... otros endpoints
  },
  // ... otras configuraciones
};
```

### 3. Interceptor HTTP
El interceptor ya está configurado en `app.config.ts`:
```typescript
provideHttpClient(withFetch(), withInterceptors([authInterceptor]))
```

### 4. Guards en rutas
Proteger rutas en `app.routes.ts`:
```typescript
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [AuthGuard]
},
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [AuthGuard],
  data: { requiresAdmin: true }
}
```

## Estructura de Respuesta de la API

### LoginResponse
```typescript
interface LoginResponse {
  id: number;
  nombre: string;
  nombreUsuario: string;
  apellidos: string;
  email: string;
  telefono: string;
  tema: number;
  menuExpandido: number;
  idIdioma: number;
  urlAvatar: string;
  role: string;
  created: string;
  updated?: string;
  isVerified: boolean;
  jwtToken: string;
  idDb: number;
  rememberAccount: boolean;
  tipoUsuario: number;
  entidad?: string;
  puesto?: string;
  descripcion?: string;
}
```

## Seguridad

1. **Tokens JWT**: Se almacenan en localStorage de forma segura
2. **Refresh Tokens**: Se manejan mediante cookies HTTP-only
3. **Renovación automática**: Los tokens se renuevan automáticamente
4. **Logout automático**: En caso de token inválido o expirado
5. **Validación de roles**: Verificación de permisos en cada petición

## Manejo de Errores

El servicio maneja automáticamente:
- Errores de conexión
- Tokens expirados
- Credenciales inválidas
- Errores de permisos
- Renovación automática de tokens

## Compatibilidad

- Angular 17+ con signals
- RxJS para observables
- HttpClient para peticiones HTTP
- LocalStorage para persistencia
- Cookies para refresh tokens
