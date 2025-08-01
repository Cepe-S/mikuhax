# Sistema de Webhooks de Discord - Guía Completa

## Resumen
Sistema completo de webhooks de Discord para el envío automático de repeticiones de partidos de Haxball con mensajes detallados y estadísticas.

## Características Principales
- ✅ Envío automático de repeticiones al finalizar partidos
- ✅ Mensajes detallados con estadísticas del partido
- ✅ Configuración simplificada con URL completa
- ✅ Validación automática de formato
- ✅ Manejo robusto de errores
- ✅ Soporte nativo para archivos .hbr2

## Configuración

### 1. Crear Webhook en Discord
1. Ir a Discord → Configuración del servidor → Integraciones → Webhooks
2. Crear nuevo webhook o usar uno existente
3. Copiar la "URL del Webhook" completa

### 2. Configurar Server Image
1. Ir a Admin → Server Images → Create New
2. En "Discord Webhook Configuration":
   - Activar "Game Feed" (opcional, para futuras funcionalidades)
   - Activar "Replay Upload" (requerido para repeticiones)
   - Pegar URL completa en "Discord Webhook URL"
3. Guardar imagen

### 3. Desplegar Servidor
- El sistema configurará automáticamente el webhook
- Las repeticiones se enviarán al finalizar cada partido

## Formato de URL Requerido
```
https://discord.com/api/webhooks/WEBHOOK_ID/WEBHOOK_TOKEN
```

**Ejemplo:**
```
https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789012345678
```

## Contenido del Mensaje

El webhook envía un mensaje detallado que incluye:

### Información del Partido
- 🏆 Resultado final con nombres de equipos
- ⏰ Tiempo jugado
- 🌟 Figura del partido (máximo goleador)

### Formaciones
- 🔴 Jugadores del equipo rojo
- 🔵 Jugadores del equipo azul

### Estadísticas Avanzadas
- ⚽️ Posesión de balón por equipo
- 🔄 Tiempo de pelota en campo por equipo
- 📊 Eventos del partido (goles, asistencias, autogoles)

### Configuración del Servidor
- 🎮 Nombre de la sala
- 🏟️ Nombre del estadio
- ⚽ Límite de goles
- ⏱️ Límite de tiempo
- 👑 Administradores presentes

### Archivo Adjunto
- 💽 Archivo de repetición (.hbr2) con timestamp

## Componentes Técnicos Implementados

### 1. Modelo de Datos (`ServerImage.ts`)
```typescript
webhooks?: {
    discord?: {
        feed: boolean;
        url?: string;
        replayUpload: boolean;
    };
};
```

### 2. Validación de URL (`serverimage.validation.ts`)
- Patrón: `/^https:\/\/discord\.com\/api\/webhooks\/\d+\/[a-zA-Z0-9_-]+$/`
- Validación en tiempo real

### 3. Funciones del Browser (`browser.ts`)
- `getDiscordWebhookConfig()`: Obtener configuración
- `setDiscordWebhookConfig()`: Establecer configuración
- `feedSocialDiscordWebhook()`: Enviar webhook
- `generateDetailedMatchMessage()`: Generar mensaje detallado

### 4. Interfaz de Usuario (`ServerImageCreate.tsx`)
- Campo único para URL completa
- Validación visual en tiempo real
- Switches para habilitar funcionalidades

### 5. Sistema de Eventos
- `onGameStart.ts`: Inicia grabación automática
- `onGameStop.ts`: Envía webhook al finalizar

## Flujo de Funcionamiento

1. **Al Crear Server Image**: Configuración se valida y almacena
2. **Al Desplegar Servidor**: Configuración se carga en `gameRoom.social.discordWebhook`
3. **Al Iniciar Partido**: Se inicia grabación automática
4. **Al Finalizar Partido**: 
   - Se detiene grabación
   - Se genera mensaje detallado con estadísticas
   - Se envía webhook con mensaje y archivo .hbr2
   - Se registra resultado en logs

## Verificación y Troubleshooting

### Logs de Éxito
```
[webhook] Successfully sent replay to Discord webhook
```

### Logs de Error Comunes
```
[webhook] Missing webhook configuration - Verificar configuración
[webhook] Discord webhook error: 404 - URL incorrecta o webhook eliminado
[webhook] Discord webhook error: 401 - Token inválido
[webhook] Error sending Discord webhook: [error] - Error de conexión
```

### Solución de Problemas

**No se envía repetición:**
- Verificar que "Replay Upload" esté activado
- Verificar que el partido haya terminado completamente
- Revisar logs del servidor

**Error 404:**
- Verificar que la URL del webhook sea correcta
- Verificar que el webhook no haya sido eliminado en Discord

**Error 401:**
- Verificar que la URL incluya el token correcto
- Regenerar webhook si es necesario

## Configuración Mínima Requerida

Para funcionamiento básico:
```typescript
{
  webhooks: {
    discord: {
      feed: false,              // Opcional
      url: "https://discord.com/api/webhooks/ID/TOKEN",
      replayUpload: true        // Requerido
    }
  }
}
```

## Archivos Modificados

1. `core/web/model/ServerImage.ts` - Modelo de datos
2. `core/web/schema/serverimage.validation.ts` - Validación
3. `core/react/component/Admin/ServerImageCreate.tsx` - Interfaz
4. `core/lib/browser.ts` - Funciones principales
5. `core/game/controller/events/onGameStop.ts` - Envío automático
6. `core/typings/global.d.ts` - Definiciones de tipos
7. `core/web/controller/api/v1/serverimage.ts` - API

## Pruebas del Sistema

### Pasos para Probar
1. Crear webhook en Discord
2. Crear server image con configuración de webhook
3. Desplegar servidor
4. Iniciar y finalizar un partido
5. Verificar recepción en Discord

### Datos de Prueba
- El mensaje incluirá estadísticas reales del partido
- El archivo .hbr2 contendrá la repetición completa
- Los logs mostrarán el estado del envío

## Notas Técnicas

- **Formato de archivo**: .hbr2 (formato nativo de Haxball)
- **Método de envío**: FormData con multipart/form-data
- **Timeout**: 30 segundos para envío
- **Tamaño máximo**: Limitado por Discord (8MB para webhooks)
- **Codificación**: UTF-8 para mensajes, binario para archivos

## Futuras Mejoras

El sistema está preparado para:
- Notificaciones de eventos en tiempo real (campo `feed`)
- Múltiples tipos de webhooks
- Configuración por tipo de evento
- Integración con otros servicios

---

**Estado**: ✅ Implementación completa y funcional
**Versión**: Actualizada con URL simplificada
**Compatibilidad**: Haxball, Discord Webhooks API v10