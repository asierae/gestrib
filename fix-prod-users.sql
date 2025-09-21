-- Script específico para corregir usuarios en la base de datos de producción
-- Ejecutar en Azure SQL Database

-- 1. Verificar qué usuarios existen y con qué idDb
SELECT 
    Id, 
    NombreUsuario, 
    Email, 
    idDb, 
    TipoUsuario, 
    activo, 
    IsVerified,
    Role
FROM Usuarios 
ORDER BY Email;

-- 2. Eliminar usuarios duplicados o incorrectos (si existen)
DELETE FROM Usuarios 
WHERE Email = 'admin@gestrib.com' AND idDb != 0;

DELETE FROM Usuarios 
WHERE Email = 'juan.perez@universidad.edu' AND idDb != 0;

-- 3. Crear/Actualizar usuario admin con idDb = 0
IF EXISTS (SELECT 1 FROM Usuarios WHERE Email = 'admin@gestrib.com')
BEGIN
    -- Actualizar usuario existente
    UPDATE Usuarios 
    SET 
        idDb = 0,
        TipoUsuario = 1,
        activo = 1,
        IsVerified = 1,
        Role = 'Admin',
        Verified = GETUTCDATE()
    WHERE Email = 'admin@gestrib.com';
END
ELSE
BEGIN
    -- Crear nuevo usuario admin
    INSERT INTO Usuarios (
        NombreUsuario, Nombre, Apellidos, Email, Telefono, idIdioma, 
        UrlAvatar, descripcion, FechaNacimiento, PasswordHash, 
        AceptadoTerminos, Role, VerificationToken, Verified, 
        ResetToken, ResetTokenExpires, PasswordReset, Created, Updated, 
        rememberAccount, Tema, MenuExpandido, idDb, TipoUsuario, 
        activo, entidad, puesto
    )
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
        GETUTCDATE(), -- Verified
        NULL,
        NULL,
        NULL,
        GETUTCDATE(), -- Created
        NULL,
        False,
        1,
        0,
        0, -- idDb = 0
        1, -- TipoUsuario = 1 (Admin)
        1, -- activo = 1
        'Sistema',
        'Administrador'
    );
END

-- 4. Crear/Actualizar usuario profesor con idDb = 0
IF EXISTS (SELECT 1 FROM Usuarios WHERE Email = 'juan.perez@universidad.edu')
BEGIN
    -- Actualizar usuario existente
    UPDATE Usuarios 
    SET 
        idDb = 0,
        TipoUsuario = 2,
        activo = 1,
        IsVerified = 1,
        Role = 'Profesor',
        Verified = GETUTCDATE()
    WHERE Email = 'juan.perez@universidad.edu';
END
ELSE
BEGIN
    -- Crear nuevo usuario profesor
    INSERT INTO Usuarios (
        NombreUsuario, Nombre, Apellidos, Email, Telefono, idIdioma, 
        UrlAvatar, descripcion, FechaNacimiento, PasswordHash, 
        AceptadoTerminos, Role, VerificationToken, Verified, 
        ResetToken, ResetTokenExpires, PasswordReset, Created, Updated, 
        rememberAccount, Tema, MenuExpandido, idDb, TipoUsuario, 
        activo, entidad, puesto
    )
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
        GETUTCDATE(), -- Verified
        NULL,
        NULL,
        NULL,
        GETUTCDATE(), -- Created
        NULL,
        False,
        1,
        0,
        0, -- idDb = 0
        2, -- TipoUsuario = 2 (Profesor)
        1, -- activo = 1
        'Universidad de Prueba',
        'Profesor Titular'
    );
END

-- 5. Verificar el resultado final
SELECT 
    Id, 
    NombreUsuario, 
    Email, 
    idDb, 
    TipoUsuario, 
    activo, 
    IsVerified,
    Role,
    Verified
FROM Usuarios 
WHERE Email IN ('admin@gestrib.com', 'juan.perez@universidad.edu')
ORDER BY Email;
