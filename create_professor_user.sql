-- Script para crear un usuario de profesor de prueba
-- Ejecutar en la base de datos de la API

-- Crear usuario de profesor
IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Email = 'profesor@test.com')
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
        'profesor@test.com',
        'profesor@test.com',
        '$2a$12$cM4QUQ3Amn9WZvhLyMgWbe5vXlwAUJ7G6n8oiYAju1NqIpD3UA1JK', -- Hash de "123456"
        1, -- IsVerified
        1, -- activo
        0, -- idDb
        2, -- TipoUsuario (Profesor)
        'Profesor', -- Role
        1, -- idIdioma (Español)
        'Profesor',
        'Test',
        GETUTCDATE(),
        GETUTCDATE()
    );
END

-- Verificar el usuario creado
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
WHERE Email = 'profesor@test.com';
