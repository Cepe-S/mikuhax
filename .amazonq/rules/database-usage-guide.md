# Haxbotron Database Usage Guide

## Database Access Pattern

Haxbotron uses a global `window.gameRoom` object that contains the player data and game state.

## Key Database Objects

### PlayerList Access
```typescript
// Get player by ID
const player = window.gameRoom.playerList.get(playerId);

// Check if player exists
if (window.gameRoom.playerList.has(playerId)) {
    const player = window.gameRoom.playerList.get(playerId)!;
}

// Iterate through all players
window.gameRoom.playerList.forEach((player, id) => {
    // Process each player
});
```

### Player Data Structure
```typescript
// Player object contains:
player.id          // Player ID
player.admin        // Admin status
player.permissions  // Permission object with superadmin property
player.name         // Player name
// Additional properties available through PlayerObject
```

### Room Communication
```typescript
// Send message to specific player
window.gameRoom._room.sendAnnouncement(
    "Message text",
    playerId,           // Target player ID (null for all)
    0x00AA00,          // Color (hex)
    "normal",          // Style
    1                  // Sound
);

// Send to all players
window.gameRoom._room.sendAnnouncement("Message", null, 0x00AA00, "normal", 1);
```

## Common Database Operations

### Player Validation
```typescript
// Always check if player exists before operations
if (!window.gameRoom.playerList.has(playerId)) {
    window.gameRoom._room.sendAnnouncement("Player not found", byPlayer.id, 0xFF7777, "normal", 2);
    return;
}
```

### Permission Checks
```typescript
// Check admin permissions
const playerData = window.gameRoom.playerList.get(byPlayer.id)!;
const isAdmin = byPlayer.admin || playerData.permissions.superadmin;

// Check superadmin only
const isSuperAdmin = playerData.permissions.superadmin;
```

### Player ID Parsing
```typescript
// Parse player ID from message (format: #123)
if (message.charAt(0) == "#") {
    let targetID: number = parseInt(message.substr(1), 10);
    if (!isNaN(targetID) && window.gameRoom.playerList.has(targetID)) {
        const targetPlayer = window.gameRoom.playerList.get(targetID)!;
        // Use targetPlayer
    }
}
```

## Database Rules

1. **Always validate player existence** before accessing player data
2. **Use window.gameRoom.playerList** for all player data operations
3. **Check permissions** before executing admin/superadmin commands
4. **Handle errors gracefully** with appropriate user feedback
5. **Use consistent color coding** for different message types
6. **Access room functions** through window.gameRoom._room
7. **Parse player IDs safely** with proper validation

## Error Handling Pattern
```typescript
try {
    if (!window.gameRoom.playerList.has(targetId)) {
        throw new Error("Player not found");
    }
    // Database operation
} catch (error) {
    console.error("Database error:", error);
    window.gameRoom._room.sendAnnouncement("Operation failed", byPlayer.id, 0xFF7777, "normal", 2);
}
```

This guide ensures consistent and safe database access patterns across all Haxbotron commands.