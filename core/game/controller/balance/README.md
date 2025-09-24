# Sistema de Balanceo de Equipos - Haxbotron

## Descripción General

El sistema de balanceo automático de Haxbotron mantiene los equipos equilibrados usando dos modos diferentes: **JT (Just Teams)** y **PRO**. Ambos modos envían mensajes informativos al chat cuando se realizan movimientos de jugadores.

## Modos de Balanceo

### Modo JT (Just Teams) ✅ TESTEADO
- **Funcionamiento**: Asigna jugadores automáticamente al equipo con menos jugadores
- **Rebalanceo**: Mueve al último jugador del equipo más grande cuando hay desbalance > 1
- **Criterio de selección**: Último en unirse al equipo más grande
- **Mensaje**: `⚖️ {jugador} fue movido al equipo {equipo} para balancear los equipos.`

### Modo PRO ⚠️ NO TESTEADO
- **Funcionamiento**: Sistema de cola FIFO (First In, First Out)
- **Asignación**: Jugadores van a cola si no hay espacio balanceado
- **Rebalanceo**: Saca jugadores de la cola cuando hay espacio
- **Criterio de selección**: Primer jugador en la cola (más antiguo)
- **Mensaje**: `⚖️ {jugador} salió de la cola y se unió al equipo {equipo}.`

## Archivos del Sistema

- **BalanceManager.ts**: Lógica principal de balanceo
- **QueueSystem.ts**: Sistema de cola para modo PRO
- **BalanceConfig.ts**: Configuración y constantes
- **BalanceDebugger.ts**: Sistema de logging y debug

## Configuración

```typescript
interface BalanceConfig {
    enabled: boolean;              // Activar/desactivar sistema
    mode: BalanceMode;            // "jt" o "pro"
    maxPlayersPerTeam: number;    // Máximo jugadores por equipo
}
```

## Criterios de Selección de Jugadores

| Modo | Situación | Jugador Seleccionado |
|------|-----------|---------------------|
| JT | Desbalance | Último del equipo más grande |
| PRO | Cola | Primero en cola (FIFO) |

## Mensajes del Sistema

- **Color**: Azul informativo (0x5DADE2)
- **Alcance**: Todos los jugadores
- **Sonido**: Normal (1)

## Estado de Testing

- ✅ **Modo JT**: Completamente testeado y funcional
- ⚠️ **Modo PRO**: Sistema implementado pero NO TESTEADO en producción

## Notas Técnicas

- Los mensajes usan el sistema de strings.ts
- El sistema previene loops infinitos con flags de procesamiento
- Usa tanto API nativa de Haxball como tracking interno
- Delay de 50-200ms para sincronización con el servidor