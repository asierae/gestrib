# Script para probar la API
Write-Host "Probando conexión a la API..."

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/defensas" -Method GET -TimeoutSec 5
    Write-Host "API respondiendo correctamente. Status: $($response.StatusCode)"
} catch {
    Write-Host "Error conectando a la API: $($_.Exception.Message)"
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/Usuarios/authenticate" -Method POST -ContentType "application/json" -Body '{"email":"test","password":"test"}' -TimeoutSec 5
    Write-Host "Endpoint de autenticación respondiendo. Status: $($response.StatusCode)"
} catch {
    Write-Host "Error en endpoint de autenticación: $($_.Exception.Message)"
}


