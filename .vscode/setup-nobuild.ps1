# Haxbotron Quick Start Script (No Build)

Write-Host 'Paso 1: Cerrando todos los procesos relacionados...' -ForegroundColor Red
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name npm -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host 'Procesos cerrados' -ForegroundColor Green

Write-Host 'Paso 2: Omitiendo construcción del proyecto...' -ForegroundColor Yellow
Write-Host 'Usando archivos previamente compilados' -ForegroundColor Yellow

Write-Host 'Paso 3: Iniciando base de datos en ventana externa...' -ForegroundColor Magenta
Set-Location (Join-Path $PSScriptRoot "..")

# Crear ventana de base de datos
Start-Process powershell.exe -ArgumentList @(
    '-NoExit',
    '-Command',
    'Write-Host "Servidor de Base de Datos Haxbotron" -ForegroundColor Magenta; npm run quick:start:db'
) -WindowStyle Normal

Start-Sleep 3

Write-Host 'Paso 4: Iniciando servidor principal en ventana externa...' -ForegroundColor Blue

# Crear ventana del servidor principal
Start-Process powershell.exe -ArgumentList @(
    '-NoExit', 
    '-Command',
    'Write-Host "Servidor Principal Haxbotron" -ForegroundColor Blue; npm run quick:start:core'
) -WindowStyle Normal

Write-Host 'Haxbotron iniciado correctamente!' -ForegroundColor Green
Write-Host 'Servidores ejecutandose en ventanas separadas:' -ForegroundColor Yellow
Write-Host '   - Base de Datos: Puerto 13001' -ForegroundColor White
Write-Host '   - Servidor Web: http://127.0.0.1:12001' -ForegroundColor White
