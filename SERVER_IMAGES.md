# Sistema de Imágenes de Servidor

## Descripción

El sistema de imágenes de servidor permite crear, almacenar y desplegar configuraciones completas de servidores Haxball sin necesidad de presets. Cada imagen contiene todos los datos necesarios para ejecutar un servidor.

## Características Principales

1. **Imágenes Completas**: Cada imagen contiene toda la configuración necesaria (settings, rules, HElo, commands, stadiums)
2. **Deploy con Token**: El headless token se proporciona durante el deploy, no se almacena en la imagen
3. **Sin Presets**: Las imágenes son autosuficientes y no dependen de configuraciones externas
4. **Overrides**: Permite modificar ciertos parámetros durante el deploy sin alterar la imagen original

## API Endpoints

### Gestión de Imágenes

#### Crear imagen desde sala existente
```
POST /api/v1/server/rooms/{ruid}/create-image
Content-Type: application/json

{
  "name": "Mi Configuración",
  "description": "Configuración personalizada para torneos",
  "ruid": "mi-servidor-torneo"
}
```

#### Listar imágenes disponibles
```
GET /api/v1/server/images
```

#### Obtener detalles de una imagen
```
GET /api/v1/server/images/{imageId}
```

#### Eliminar imagen
```
DELETE /api/v1/server/images/{imageId}
```

### Deploy de Servidores

#### Desplegar servidor desde imagen
```
POST /api/v1/server/deploy
Content-Type: application/json

{
  "imageId": "basic_default_1234567890",
  "token": "tu-headless-token-aqui",
  "overrides": {
    "roomName": "Sala Personalizada",
    "password": "mi-password",
    "maxPlayers": 20,
    "public": false
  }
}
```

## Estructura de una Imagen

```json
{
  "name": "Nombre de la imagen",
  "description": "Descripción detallada",
  "ruid": "mi-servidor-unico",
  "version": "1.0.0",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "config": {
    "roomName": "Nombre de la sala",
    "playerName": "Nombre del host",
    "maxPlayers": 16,
    "public": true,
    "noPlayer": false,
    "geo": {
      "code": "AR",
      "lat": -34.6882652,
      "lon": -58.5685501
    }
  },
  "settings": { /* Configuraciones del servidor */ },
  "rules": { /* Reglas del juego */ },
  "helo": { /* Sistema de rating */ },
  "commands": { /* Comandos disponibles */ },
  "stadiums": {
    "default": "Classic",
    "ready": "Classic"
  }
}
```

## Flujo de Trabajo

### 1. Crear una Imagen
1. Configura un servidor con todas las opciones deseadas
2. Usa el endpoint para crear imagen desde la sala existente
3. La imagen se guarda con toda la configuración

### 2. Desplegar Servidor
1. Selecciona la imagen que deseas usar (que ya contiene el RUID)
2. Proporciona el headless token
3. Opcionalmente, especifica overrides para personalizar
4. El servidor se despliega con la configuración y RUID de la imagen

### 3. Gestionar Imágenes
- Lista todas las imágenes disponibles
- Ve los detalles de cada imagen
- Elimina imágenes que ya no necesites

## Ventajas del Sistema

1. **Portabilidad**: Las imágenes pueden compartirse entre diferentes instalaciones
2. **Consistencia**: Garantiza que todos los servidores tengan la configuración exacta
3. **Seguridad**: Los tokens no se almacenan en las imágenes
4. **Flexibilidad**: Los overrides permiten personalización sin modificar la imagen base
5. **Versionado**: Cada imagen tiene su versión y fecha de creación
6. **RUID Integrado**: Cada imagen tiene su RUID único predefinido, evitando conflictos

## Migración desde el Sistema Anterior

El método `createRoom` sigue funcionando pero está marcado como legacy. Se recomienda:

1. Crear imágenes de las configuraciones existentes
2. Usar el nuevo sistema de deploy para nuevos servidores
3. Migrar gradualmente los servidores existentes

## Utilidades

### Crear Imagen por Defecto
```bash
cd core
npx ts-node utilities/migrate-to-images.ts
```

Esto crea una imagen básica con configuración estándar que puede usarse como punto de partida.

## Consideraciones de Seguridad

- Los headless tokens nunca se almacenan en las imágenes
- Las imágenes se almacenan localmente en el directorio `server-images/`
- Se recomienda hacer backup regular de las imágenes importantes
- Los tokens deben proporcionarse de forma segura durante el deploy