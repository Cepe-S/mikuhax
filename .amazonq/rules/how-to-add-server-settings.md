# Guía Completa: Cómo Agregar Nuevas Settings al Servidor Haxbotron

## Pasos Obligatorios para Agregar una Nueva Setting

### 1. Actualizar las Interfaces de TypeScript

#### A. GameRoomSettings (core/game/model/Configuration/GameRoomSettings.ts)
```typescript
export interface GameRoomSettings {
    // ... propiedades existentes ...
    
    // Nueva setting
    miNuevaSetting: boolean // descripción de la setting
    miNuevaSettingNumero: number // otra setting numérica
}
```

#### B. BrowserHostRoomSettings (core/lib/browser.hostconfig.ts)
```typescript
export interface BrowserHostRoomSettings {
    // ... propiedades existentes ...
    
    // Nueva setting (debe coincidir exactamente con GameRoomSettings)
    miNuevaSetting: boolean // descripción de la setting
    miNuevaSettingNumero: number // otra setting numérica
}
```

#### C. Si es una regla de juego, actualizar BrowserHostRoomGameRule
```typescript
export interface BrowserHostRoomGameRule {
    // ... propiedades existentes ...
    
    // Nueva regla de juego
    miNuevaRegla: string // descripción de la regla
}
```

### 2. Actualizar Configuración por Defecto

#### Archivo: core/react/lib/defaultroomconfig.json
```json
{
    "settings": {
        // ... settings existentes ...
        "miNuevaSetting": true,
        "miNuevaSettingNumero": 10
    },
    "rules": {
        // ... reglas existentes ...
        "miNuevaRegla": "valorPorDefecto"
    }
}
```

### 3. Actualizar Formularios React (Opcional pero Recomendado)

#### Archivo: core/react/component/Admin/ServerImageForm.tsx

Agregar campos en el formulario:
```typescript
// En el JSX del formulario
<Grid item xs={12} md={6}>
    <FormControlLabel
        control={
            <Switch
                checked={settingsFormField.miNuevaSetting || false}
                onChange={(e) => setSettingsFormField({
                    ...settingsFormField,
                    miNuevaSetting: e.target.checked
                })}
            />
        }
        label="Mi Nueva Setting"
    />
</Grid>

<Grid item xs={12} md={6}>
    <TextField
        fullWidth
        type="number"
        label="Mi Nueva Setting Número"
        value={settingsFormField.miNuevaSettingNumero || 10}
        onChange={(e) => setSettingsFormField({
            ...settingsFormField,
            miNuevaSettingNumero: parseInt(e.target.value) || 10
        })}
        helperText="Descripción de qué hace esta setting"
        inputProps={{ min: 1, max: 100 }}
    />
</Grid>
```

### 4. Verificar Compilación

Ejecutar para verificar que no hay errores:
```bash
cd core
npm run build:ts
```

## Tipos de Settings Comunes

### Settings Booleanas (true/false)
```typescript
miSettingBooleana: boolean
```
Valor por defecto: `true` o `false`

### Settings Numéricas
```typescript
miSettingNumerica: number
```
Valor por defecto: cualquier número (ej: `10`, `0`, `1000`)

### Settings de Texto
```typescript
miSettingTexto: string
```
Valor por defecto: cualquier string (ej: `"valorDefecto"`, `""`)

## Categorías de Settings

### 1. Settings de Juego (GameRoomSettings)
- Configuraciones que afectan la mecánica del juego
- Límites de tiempo, puntuación, etc.
- Configuraciones de física de la pelota

### 2. Settings de Seguridad (GameRoomSettings)
- Anti-flood, anti-spam
- Límites de comportamiento
- Configuraciones de baneos

### 3. Reglas de Juego (BrowserHostRoomGameRule)
- Configuraciones de equipos
- Mapas por defecto
- Modos de balanceo

## Ejemplo Completo: Agregar "autoKickInactivos"

### 1. GameRoomSettings.ts
```typescript
// Balance system settings
balanceEnabled: boolean
balanceMode: string
balanceMaxPlayersPerTeam: number

// Auto-kick system settings
autoKickInactivos: boolean // activar kick automático de jugadores inactivos
tiempoInactividadMinutos: number // minutos de inactividad antes del kick
```

### 2. browser.hostconfig.ts
```typescript
// Balance system settings
balanceEnabled: boolean
balanceMode: string
balanceMaxPlayersPerTeam: number

// Auto-kick system settings
autoKickInactivos: boolean // activar kick automático de jugadores inactivos
tiempoInactividadMinutos: number // minutos de inactividad antes del kick
```

### 3. defaultroomconfig.json
```json
{
    "settings": {
        "balanceEnabled": true,
        "balanceMode": "jt",
        "balanceMaxPlayersPerTeam": 4,
        "autoKickInactivos": false,
        "tiempoInactividadMinutos": 5
    }
}
```

### 4. ServerImageForm.tsx (opcional)
```typescript
<Grid item xs={12} md={6}>
    <FormControlLabel
        control={
            <Switch
                checked={settingsFormField.autoKickInactivos || false}
                onChange={(e) => setSettingsFormField({
                    ...settingsFormField,
                    autoKickInactivos: e.target.checked
                })}
            />
        }
        label="Auto-kick Jugadores Inactivos"
    />
</Grid>

<Grid item xs={12} md={6}>
    <TextField
        fullWidth
        type="number"
        label="Tiempo de Inactividad (minutos)"
        value={settingsFormField.tiempoInactividadMinutos || 5}
        onChange={(e) => setSettingsFormField({
            ...settingsFormField,
            tiempoInactividadMinutos: parseInt(e.target.value) || 5
        })}
        disabled={!settingsFormField.autoKickInactivos}
        helperText="Minutos de inactividad antes del kick automático"
        inputProps={{ min: 1, max: 60 }}
    />
</Grid>
```

## Notas Importantes

1. **Consistencia**: Los nombres de las propiedades deben ser exactamente iguales en todas las interfaces
2. **Valores por defecto**: Siempre proporcionar valores por defecto sensatos
3. **Documentación**: Agregar comentarios descriptivos a cada nueva setting
4. **Compilación**: Verificar que no hay errores de TypeScript después de cada cambio
5. **Retrocompatibilidad**: Las nuevas settings deben tener valores por defecto para no romper configuraciones existentes

## Archivos Clave a Recordar

- `core/game/model/Configuration/GameRoomSettings.ts` - Interface principal de settings
- `core/lib/browser.hostconfig.ts` - Interface del navegador
- `core/react/lib/defaultroomconfig.json` - Configuración por defecto
- `core/react/component/Admin/ServerImageForm.tsx` - Formulario de configuración (opcional)

## Verificación Final

Después de agregar una nueva setting:
1. ✅ Compilación exitosa (`npm run build:ts`)
2. ✅ Valor por defecto definido
3. ✅ Interfaces actualizadas
4. ✅ Documentación agregada
5. ✅ Formulario actualizado (si es necesario)