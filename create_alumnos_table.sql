-- CREATE TABLE para la tabla Alumnos
CREATE TABLE Alumnos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    DNI NVARCHAR(20) NOT NULL UNIQUE,
    Nombre NVARCHAR(100) NOT NULL,
    Apellidos NVARCHAR(200) NOT NULL,
    Titulacion NVARCHAR(200) NOT NULL,
    Asignatura NVARCHAR(200) NOT NULL,
    CreditosSup INT NOT NULL,
    MediaExpediente DECIMAL(5,3) NOT NULL,
    IdTipoGrado INT NOT NULL, -- 1: Grado en Ingeniería Informática, 2: Grado en Inteligencia Artificial
    Created DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    Updated DATETIME2 NULL,
    CONSTRAINT FK_Alumnos_TipoGrado FOREIGN KEY (IdTipoGrado) REFERENCES TiposGrado(Id)
);

-- Tabla de tipos de grado (si no existe)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TiposGrado' AND xtype='U')
BEGIN
    CREATE TABLE TiposGrado (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(100) NOT NULL UNIQUE,
        Descripcion NVARCHAR(500) NULL,
        Created DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        Updated DATETIME2 NULL
    );
    
    -- Insertar tipos de grado
    INSERT INTO TiposGrado (Nombre, Descripcion) VALUES 
    ('Grado en Ingeniería Informática', 'Grado en Ingeniería Informática'),
    ('Grado en Inteligencia Artificial', 'Grado en Inteligencia Artificial');
END

-- Índices para mejorar el rendimiento
CREATE INDEX IX_Alumnos_DNI ON Alumnos(DNI);
CREATE INDEX IX_Alumnos_IdTipoGrado ON Alumnos(IdTipoGrado);
CREATE INDEX IX_Alumnos_Created ON Alumnos(Created);

