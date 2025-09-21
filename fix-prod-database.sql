-- Script para verificar y corregir la base de datos de producción
-- Ejecutar en la base de datos de Azure

-- 1. Verificar el estado actual de los usuarios
SELECT 
    Id, 
    NombreUsuario, 
    Email, 
    PasswordHash, 
    IsVerified, 
    activo, 
    idDb, 
    TipoUsuario, 
    Role,
    Verified
FROM Usuarios 
WHERE Email IN ('admin@gestrib.com', 'juan.perez@universidad.edu')
ORDER BY Email;

-- 2. Actualizar el usuario admin para asegurar que tenga idDb = 0
UPDATE Usuarios 
SET 
    IsVerified = 1,
    activo = 1,
    idDb = 0,
    TipoUsuario = 1,
    Role = 'Admin',
    Verified = GETUTCDATE()
WHERE Email = 'admin@gestrib.com';

-- 3. Actualizar el usuario profesor para asegurar que tenga idDb = 0
UPDATE Usuarios 
SET 
    IsVerified = 1,
    activo = 1,
    idDb = 0,
    TipoUsuario = 2,
    Role = 'Profesor',
    Verified = GETUTCDATE()
WHERE Email = 'juan.perez@universidad.edu';

-- 4. Verificar el estado después de la actualización
SELECT 
    Id, 
    NombreUsuario, 
    Email, 
    PasswordHash, 
    IsVerified, 
    activo, 
    idDb, 
    TipoUsuario, 
    Role,
    Verified
FROM Usuarios 
WHERE Email IN ('admin@gestrib.com', 'juan.perez@universidad.edu')
ORDER BY Email;

-- 5. Si no existen los usuarios, crearlos
IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Email = 'admin@gestrib.com')
BEGIN
    INSERT INTO Usuarios (NombreUsuario, Nombre, Apellidos, Email, Telefono, idIdioma, UrlAvatar, descripcion, FechaNacimiento, PasswordHash, AceptadoTerminos, Role, VerificationToken, Verified, ResetToken, ResetTokenExpires, PasswordReset, Created, Updated, rememberAccount, Tema, MenuExpandido, idDb, TipoUsuario, activo, entidad, puesto)
    VALUES (
        'admin',
        'Administrador',
        'Sistema',
        'admin@gestrib.com',
        NULL,
        1, -- idIdioma (1 para Español)
        'https://www.w3schools.com/howto/img_avatar.png',
        NULL,
        '1900-01-01',
        '$2a$12$cM4QUQ3Amn9WZvhLyMgWbe5vXlwAUJ7G6n8oiYAju1NqIpD3UA1JK', -- Hash de '123456'
        'True',
        'Admin',
        NULL,
        GETUTCDATE(), -- Verified (fecha actual)
        NULL,
        NULL,
        NULL,
        GETUTCDATE(),
        NULL,
        False,
        1,
        0,
        0, -- idDb (0 para la base de datos principal)
        1, -- TipoUsuario (1 para Admin)
        1, -- activo (1 para activo)
        'Sistema',
        'Administrador'
    );
END

IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Email = 'juan.perez@universidad.edu')
BEGIN
    INSERT INTO Usuarios (NombreUsuario, Nombre, Apellidos, Email, Telefono, idIdioma, UrlAvatar, descripcion, FechaNacimiento, PasswordHash, AceptadoTerminos, Role, VerificationToken, Verified, ResetToken, ResetTokenExpires, PasswordReset, Created, Updated, rememberAccount, Tema, MenuExpandido, idDb, TipoUsuario, activo, entidad, puesto)
    VALUES (
        'profesor1',
        'Juan',
        'Pérez García',
        'juan.perez@universidad.edu',
        NULL,
        1, -- idIdioma (1 para Español)
        'https://www.w3schools.com/howto/img_avatar.png',
        NULL,
        '1900-01-01',
        '$2a$12$cM4QUQ3Amn9WZvhLyMgWbe5vXlwAUJ7G6n8oiYAju1NqIpD3UA1JK', -- Hash de '123456'
        'True',
        'Profesor',
        NULL,
        GETUTCDATE(), -- Verified (fecha actual)
        NULL,
        NULL,
        NULL,
        GETUTCDATE(),
        NULL,
        False,
        1,
        0,
        0, -- idDb (0 para la base de datos principal)
        2, -- TipoUsuario (2 para Profesor)
        1, -- activo (1 para activo)
        'Universidad de Prueba',
        'Profesor Titular'
    );
END
