-- Script para verificar y corregir el usuario de prueba
-- Ejecutar en la base de datos de la API

-- 1. Verificar el usuario actual
SELECT 
    Id,
    NombreUsuario,
    Email,
    PasswordHash,
    IsVerified,
    activo,
    idDb,
    TipoUsuario,
    Role
FROM Usuarios 
WHERE Email = 'admin@test.com' OR NombreUsuario = 'admin@test.com';

-- 2. Actualizar el usuario para que esté verificado y activo
UPDATE Usuarios 
SET 
    IsVerified = 1,
    activo = 1,
    idDb = 0,
    TipoUsuario = 1, -- Admin
    Role = 'Admin'
WHERE Email = 'admin@test.com' OR NombreUsuario = 'admin@test.com';

-- 3. Verificar que el hash de la contraseña es correcto
-- El hash $2a$12$cM4QUQ3Amn9WZvhLyMgWbe5vXlwAUJ7G6n8oiYAju1NqIpD3UA1JK corresponde a "123456"
-- Verificar con: SELECT BCrypt.Verify('123456', '$2a$12$cM4QUQ3Amn9WZvhLyMgWbe5vXlwAUJ7G6n8oiYAju1NqIpD3UA1JK')

-- 4. Si no existe el usuario, crearlo
IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Email = 'admin@test.com')
BEGIN
    INSERT INTO Usuarios (
        NombreUsuario,
        Email,
        PasswordHash,
        IsVerified,
        activo,
        idDb,
        TipoUsuario,
        Role,
        idIdioma,
        Nombre,
        Apellidos,
        Created,
        Updated
    ) VALUES (
        'admin@test.com',
        'admin@test.com',
        '$2a$12$cM4QUQ3Amn9WZvhLyMgWbe5vXlwAUJ7G6n8oiYAju1NqIpD3UA1JK', -- Hash de "123456"
        1, -- IsVerified
        1, -- activo
        0, -- idDb
        1, -- TipoUsuario (Admin)
        'Admin', -- Role
        1, -- idIdioma (Español)
        'Admin',
        'Test',
        GETUTCDATE(),
        GETUTCDATE()
    );
END

-- 5. Verificar el resultado final
SELECT 
    Id,
    NombreUsuario,
    Email,
    PasswordHash,
    IsVerified,
    activo,
    idDb,
    TipoUsuario,
    Role
FROM Usuarios 
WHERE Email = 'admin@test.com' OR NombreUsuario = 'admin@test.com';
