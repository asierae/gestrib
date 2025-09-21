# 🔧 Configuración de Azure para GESTRIB API

## Problema Identificado
- ✅ API funciona (endpoint `/Log/test` responde)
- ❌ Autenticación falla con "Número de usuario incorrecto"
- ✅ Local funciona correctamente

## Soluciones Requeridas en Azure

### 1. **Verificar Base de Datos en Azure**

#### Opción A: Azure SQL Database
1. Ir a [Azure Portal](https://portal.azure.com)
2. Buscar "SQL databases" o "SQL servers"
3. Verificar que existe una base de datos para la API
4. Verificar la cadena de conexión en App Service

#### Opción B: Verificar App Service Configuration
1. Ir a App Service: `gestribapi-dncrgfhrebbzgwdk`
2. Ir a "Configuration" → "Connection strings"
3. Verificar que existe una cadena de conexión a la base de datos
4. Verificar que el nombre coincide con el usado en la API

### 2. **Ejecutar Script SQL en Azure**

#### Conectar a la base de datos y ejecutar:

```sql
-- 1. Verificar si existen las tablas
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE';

-- 2. Verificar si existe la tabla Usuarios
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Usuarios';

-- 3. Verificar usuarios existentes
SELECT Id, Email, idDb, TipoUsuario, activo, IsVerified 
FROM Usuarios;
```

#### Si no existen las tablas, ejecutar el script completo de `tablas.txt`

#### Si existen las tablas pero no los usuarios, ejecutar `fix-prod-users.sql`

### 3. **Verificar Configuración de la API**

#### En Azure App Service:
1. Ir a "Configuration" → "Application settings"
2. Verificar que existe:
   - `ConnectionStrings__DefaultConnection` (o similar)
   - `AppSettings__Secret` (o similar)

#### Verificar logs de la API:
1. Ir a "Monitoring" → "Log stream"
2. Buscar errores relacionados con base de datos
3. Verificar que la API se conecta correctamente

### 4. **Scripts de Verificación**

#### Script 1: Verificar conexión a BD
```sql
-- Ejecutar en Azure SQL Database
SELECT 
    DB_NAME() as DatabaseName,
    USER_NAME() as CurrentUser,
    @@VERSION as SqlVersion;
```

#### Script 2: Verificar usuarios
```sql
-- Verificar todos los usuarios
SELECT 
    Id, 
    Email, 
    idDb, 
    TipoUsuario, 
    activo, 
    IsVerified,
    Role,
    Created,
    Updated
FROM Usuarios 
ORDER BY Created DESC;
```

#### Script 3: Crear usuarios si no existen
```sql
-- Ejecutar fix-prod-users.sql completo
```

### 5. **Verificar CORS en Azure**

#### En Program.cs de la API, verificar que CORS esté configurado:
```csharp
app.UseCors(x => x
    .SetIsOriginAllowed(origin => true)
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials());
```

### 6. **Pasos de Diagnóstico**

1. **Usar `azure-debug.html`** para probar la API
2. **Verificar logs de Azure** para errores de base de datos
3. **Ejecutar scripts SQL** en la base de datos de Azure
4. **Verificar configuración** de App Service

### 7. **Posibles Causas del Error**

1. **Base de datos no existe** en Azure
2. **Cadena de conexión incorrecta** en App Service
3. **Tablas no creadas** en la base de datos
4. **Usuarios no existen** en la base de datos
5. **Configuración de idDb incorrecta** en la base de datos

## Próximos Pasos

1. Ejecutar `azure-debug.html` para diagnóstico
2. Verificar base de datos en Azure Portal
3. Ejecutar scripts SQL necesarios
4. Probar autenticación nuevamente
