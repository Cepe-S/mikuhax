# Sistema de Indicadores de Administradores

Este documento explica el sistema de diferenciación sutil para administradores implementado en Haxbotron.

## Indicadores Visuales

### 👑 Super Administrador
- **Emoji:** 👑 (corona)
- **Descripción:** Indica que el jugador tiene permisos de super administrador
- **Posición:** Aparece antes del nombre del jugador

### ⭐ Administrador
- **Emoji:** ⭐ (estrella)
- **Descripción:** Indica que el jugador tiene permisos de administrador estándar
- **Posición:** Aparece después del indicador de super admin (si existe) y antes del nombre

## Dónde Aparecen los Indicadores

### 1. Chat del Juego
Los mensajes en el chat muestran los indicadores junto al nivel del jugador:
```
🔴 ⟨ LV.5 ⟩👑⭐ ▶ NombreJugador: mensaje
```

### 2. Mensaje de Bienvenida
Cuando un jugador se une, el mensaje de bienvenida incluye los indicadores:
```
📢 ¡Bienvenido 👑⭐NombreJugador#12! ⟨ LV.5 ⟩ 📄 Usa !help para ver los comandos de ayuda.
```

### 3. Comando !list
Las listas de jugadores muestran los indicadores:
```
📜 👑⭐NombreJugador#12, NombreJugador2#13, ...
```

### 4. Comando !stats
Las estadísticas muestran los indicadores en el nombre:
```
📊 Estadísticas de 👑⭐NombreJugador#12 (Puntuación ⚽1200): ...
```

### 5. Panel de Administración Web
En la interfaz web, los indicadores aparecen junto al nombre en la lista de jugadores.

## Características del Sistema

### Diseño Sutil
- Los indicadores son pequeños emojis que no dominan visualmente
- Se integran naturalmente con el sistema de niveles existente
- No alteran significativamente el diseño del chat

### Jerarquía Clara
- Super Admin (👑) tiene prioridad visual sobre Admin (⭐)
- Los indicadores aparecen en orden de importancia
- Fácil identificación sin ser intrusivo

### Consistencia
- Los mismos indicadores se usan en todas las interfaces
- Comportamiento uniforme en chat, comandos y panel web
- Mantiene la estética del sistema existente

## Implementación Técnica

Los indicadores se agregan dinámicamente basándose en:
- `player.admin`: Determina si mostrar ⭐
- `playerData.permissions.superadmin`: Determina si mostrar 👑

El sistema es compatible con todas las funcionalidades existentes y no afecta el rendimiento del servidor.