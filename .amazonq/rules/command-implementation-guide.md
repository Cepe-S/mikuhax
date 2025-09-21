# Haxbotron Command Implementation Guide

## Command Structure Overview

Haxbotron uses a modern command registry system that automatically registers commands. All commands follow a consistent pattern and are processed through the `CommandRegistry`.

## How to Implement a New Command

### 1. File Structure
- Create a new file in: `core/game/controller/commands/[commandname].ts`
- Import the file in `Parser.ts` to auto-register the command

### 2. Basic Command Template

```typescript
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { registerCommand } from "../CommandRegistry";

export function cmd[CommandName](byPlayer: PlayerObject, fullMessage?: string): void {
    // Parse arguments if needed
    const msgChunk = fullMessage ? fullMessage.split(" ") : [];
    const firstArg = msgChunk[1]; // First argument after command
    const secondArg = msgChunk[2]; // Second argument after command
    
    // Command logic here
    
    // Send response to player
    window.gameRoom._room.sendAnnouncement(
        "Your message here",
        byPlayer.id,
        0x00AA00, // Color (hex)
        "normal", // Style: "normal", "bold", "italic", "small", "small-bold", "small-italic"
        1 // Sound: 0=none, 1=normal, 2=notification
    );
}

// Register the command
registerCommand("[commandname]", cmd[CommandName], {
    helpText: "Description of what the command does",
    category: "Basic Commands" | "Game Commands" | "Admin Commands" | "Special Features",
    requiresArgs: false, // true if command requires arguments
    adminOnly: false, // true if only admins can use
    superAdminOnly: false // true if only superadmins can use
});
```

### 3. Command Categories
- **"Basic Commands"**: General utility commands (help, stats, etc.)
- **"Game Commands"**: Game-related functionality (balance, teams, etc.)
- **"Admin Commands"**: Administrative functions (ban, mute, etc.)
- **"Special Features"**: Advanced or unique features

### 4. Permission Levels
- **No restrictions**: Any player can use
- **adminOnly: true**: Only room admins can use
- **superAdminOnly: true**: Only superadmins can use

### 5. Message Parsing
```typescript
// Parse full message for arguments
const msgChunk = fullMessage ? fullMessage.split(" ") : [];
const command = msgChunk[0]; // The command itself (!command)
const firstArg = msgChunk[1]; // First argument
const secondArg = msgChunk[2]; // Second argument
// etc.
```

### 6. Common Patterns

#### Player Lookup by ID
```typescript
if (message.charAt(0) == "#") {
    let targetID: number = parseInt(message.substr(1), 10);
    if (!isNaN(targetID) && window.gameRoom.playerList.has(targetID)) {
        const targetPlayer = window.gameRoom.playerList.get(targetID)!;
        // Use targetPlayer
    } else {
        window.gameRoom._room.sendAnnouncement("Player not found", byPlayer.id, 0xFF7777, "normal", 2);
    }
}
```

#### Admin Permission Check
```typescript
const playerData = window.gameRoom.playerList.get(byPlayer.id)!;
const isAdmin = byPlayer.admin || playerData.permissions.superadmin;
if (!isAdmin) {
    window.gameRoom._room.sendAnnouncement("Admin only command", byPlayer.id, 0xFF7777, "normal", 2);
    return;
}
```

#### Error Handling
```typescript
try {
    // Command logic
} catch (error) {
    console.error(`Error in command:`, error);
    window.gameRoom._room.sendAnnouncement("Command error", byPlayer.id, 0xFF7777, "normal", 2);
}
```

### 7. Color Codes
- `0x00AA00`: Green (success)
- `0xFF7777`: Red (error)
- `0xFFD700`: Gold (admin/special)
- `0x479947`: Dark green (info)
- `0xFFFFFF`: White (default)

### 8. Registration in Parser.ts
After creating your command file, add the import to `Parser.ts`:
```typescript
import "./commands/[yourcommand]";
```

### 9. Best Practices
- Always validate input parameters
- Provide clear error messages
- Use consistent color coding
- Include helpful text in the registration
- Handle edge cases (empty args, invalid IDs, etc.)
- Log important actions for debugging
- Keep command logic focused and simple

### 10. Example Implementation
See existing commands like `stats.ts`, `help.ts`, or `ban.ts` for complete examples.

## Command Processing Flow
1. Player types message starting with `!`
2. `onPlayerChat` detects command and calls `parseCommand`
3. `parseCommand` checks if command is registered in `CommandRegistry`
4. If found, executes the command handler with permission checks
5. Command handler processes arguments and sends response

This system ensures all commands are automatically discovered, properly registered, and consistently handled.