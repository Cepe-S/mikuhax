# Sistema de Estadios e Inicio de Partidos - Haxbotron

## Descripción General

Haxbotron cuenta con un sistema automatizado que gestiona el cambio de estadios y el inicio de partidos basado en la cantidad de jugadores activos. El sistema opera en dos estados principales y garantiza que siempre haya un juego en curso cuando el modo automático está habilitado.

## Estados del Sistema

### 🟡 Estado READY (Esperando jugadores)
- **Condición**: Menos jugadores que el mínimo requerido
- **Estadio**: Mapa de entrenamiento (configurable)
- **Comportamiento**: Espera a que se unan más jugadores
- **Mensaje**: `🏟️ Esperando jugadores: TRAINING (X/Y jugadores)`

### 🟢 Estado PLAYING (Jugando)
- **Condición**: Suficientes jugadores para iniciar
- **Estadio**: Mapa de juego principal (configurable)
- **Comportamiento**: Inicia automáticamente el partido
- **Mensaje**: `🏟️ Iniciando partido: FUTX4 (X/Y jugadores)`

## Configuración del Sistema

### Settings Principales
```json
{
  "rules": {
    "autoOperating": true,           // Activar modo automático
    "defaultMapName": "futx4",       // Mapa para partidos
    "readyMapName": "futx2",         // Mapa de espera
    "requisite": {
      "minimumPlayers": 1            // Jugadores mínimos para iniciar
    }
  }
}
```

### Estadios Disponibles
- **futx2**: Cancha 2v2
- **futx3**: Cancha 3v3  
- **futx4**: Cancha 4v4 (por defecto)
- **futx5**: Cancha 5v5
- **futx7**: Cancha 7v7
- **training**: Cancha de entrenamiento

## Flujo de Funcionamiento

### 1. Inicialización del Servidor
```
Servidor inicia → Carga mapa de espera → Auto-inicia juego (si autoOperating=true)
```

### 2. Jugadores Se Unen
```
Jugador se une → Verifica cantidad → Si ≥ mínimo → Cambia a mapa de juego → Inicia partido
```

### 3. Jugadores Se Van
```
Jugador se va → Verifica cantidad → Si < mínimo → Cambia a mapa de espera → Mantiene juego activo
```

### 4. Final de Partido
```
Partido termina → Verifica cantidad → Selecciona mapa apropiado → Inicia nuevo partido
```

## Características del Sistema

### ✅ Garantías del Sistema
- **Siempre hay un juego activo** cuando autoOperating está habilitado
- **Cambios de estadio automáticos** basados en cantidad de jugadores
- **Prevención de loops infinitos** con flags de procesamiento
- **Sincronización con el servidor** mediante delays apropiados

### 🔧 Funcionalidades Técnicas
- **Configuración dinámica de pelota**: Radio, color, física personalizable
- **Sistema de debug**: Tracking de todas las acciones del sistema
- **Reinicialización de powershot**: Después de cada cambio de estadio
- **Logging completo**: Todas las acciones se registran en logs

## Sistema de Balanceo Integrado

### Modo JT (Just Teams) ✅ TESTEADO
- **Asignación automática** al equipo con menos jugadores
- **Rebalanceo dinámico** cuando hay desbalance > 1 jugador
- **Criterio**: Último jugador del equipo más grande se mueve
- **Mensaje**: `⚖️ {jugador} fue movido al equipo {equipo} para balancear los equipos.`

### Modo PRO ⚠️ NO TESTEADO
- **Sistema de cola FIFO** (First In, First Out)
- **Cola automática** cuando no hay espacio balanceado
- **Criterio**: Primer jugador en cola se asigna cuando hay espacio
- **Mensaje**: `⚖️ {jugador} salió de la cola y se unió al equipo {equipo}.`

### Configuración de Balanceo
```json
{
  "settings": {
    "balanceEnabled": true,
    "balanceMode": "jt",              // "jt" o "pro"
    "balanceMaxPlayersPerTeam": 4
  }
}
```

## Comandos de Administración

### !debugstadium (Solo Admins)
Muestra información detallada del sistema:
- Estado actual del estadio
- Cantidad de jugadores activos
- Configuración de mapas
- Últimas 5 acciones del sistema

### !balance (Todos los jugadores)
Información del sistema de balanceo:
- Modo actual de balanceo
- Estado de los equipos
- Cola de jugadores (modo PRO)

## Archivos del Sistema

### Core del Sistema
- **`StadiumManager.ts`**: Lógica principal de gestión de estadios
- **`stadiumLoader.ts`**: Carga y configuración de mapas
- **`onGameStart.ts`**: Eventos de inicio de partido
- **`onStadiumChange.ts`**: Eventos de cambio de estadio

### Sistema de Balanceo
- **`BalanceManager.ts`**: Lógica de balanceo de equipos
- **`QueueSystem.ts`**: Sistema de cola para modo PRO
- **`BalanceConfig.ts`**: Configuración de balanceo
- **`BalanceDebugger.ts`**: Debug y logging de balanceo

### Mapas de Estadios
- **`futx2.hbs.ts`** a **`futx7.hbs.ts`**: Definiciones de estadios
- **`training.hbs.ts`**: Estadio de entrenamiento

## Personalización de Pelota

El sistema permite personalizar la física de la pelota mediante placeholders:
```typescript
// Configuraciones disponibles
ballRadius: 6.4,        // Radio de la pelota
ballColor: "0",         // Color (código)
ballBCoeff: 0.4,        // Coeficiente de rebote
ballInvMass: 1.5,       // Masa inversa
ballDamping: 0.99       // Amortiguación
```

## Sistema de Debug y Logging

### Debug Actions Tracking
El sistema mantiene un historial de las últimas 20 acciones:
- **Timestamp**: Momento exacto de la acción
- **Action**: Tipo de acción realizada
- **Stadium**: Estadio involucrado
- **State**: Estado del sistema
- **Player Count**: Cantidad de jugadores
- **Reason**: Razón de la acción

### Logging Automático
- **Cambios de estadio**: Se registran todos los cambios
- **Inicios de juego**: Se logea cada inicio automático
- **Errores**: Se capturan y registran todos los errores
- **Acciones de balanceo**: Se registran movimientos de jugadores

## Mensajes del Sistema

### Colores Utilizados
- **🟡 Amarillo (0xFFD700)**: Estado de espera
- **🟢 Verde (0x00FF00)**: Estado de juego
- **🔵 Azul (0x5DADE2)**: Mensajes de balanceo
- **🔴 Rojo (0xFF7777)**: Errores
- **⚪ Blanco (0x00AA00)**: Información general

### Formato de Mensajes
- **Alcance**: Todos los jugadores (null) o específico (playerId)
- **Estilo**: "bold", "normal", "small"
- **Sonido**: 0=silencio, 1=normal, 2=notificación

## Solución de Problemas

### Problema: El juego no inicia automáticamente
**Solución**: Verificar que `autoOperating: true` en la configuración

### Problema: Los estadios no cambian
**Solución**: Verificar que `minimumPlayers` esté configurado correctamente

### Problema: El balanceo no funciona
**Solución**: Verificar que `balanceEnabled: true` y el modo sea válido

### Problema: Errores en el cambio de estadio
**Solución**: Usar `!debugstadium` para ver el estado del sistema

## Estado de Testing

- ✅ **Sistema de Estadios**: Completamente testeado y funcional
- ✅ **Inicio Automático**: Testeado y funcional
- ✅ **Balanceo JT**: Completamente testeado
- ⚠️ **Balanceo PRO**: Implementado pero NO TESTEADO en producción
- ✅ **Debug System**: Testeado y funcional

## Notas Técnicas

### Delays y Sincronización
- **50ms**: Delay para procesamiento de balanceo
- **500ms**: Delay para inicio de juego después de cambio de estadio
- **1000ms**: Delay para cambios de estadio después de eventos
- **1500ms**: Delay para nuevo juego después de final de partido

### Prevención de Problemas
- **Flags de procesamiento**: Previenen loops infinitos
- **Validación de jugadores**: Verificación antes de cada acción
- **Fallbacks**: Sistema de respaldo si falla la API nativa
- **Error handling**: Captura y manejo de todos los errores

Este sistema garantiza una experiencia de juego fluida y automatizada, manteniendo los equipos balanceados y asegurando que siempre haya actividad en el servidor.