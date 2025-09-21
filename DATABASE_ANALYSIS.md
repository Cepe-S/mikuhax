# Haxbotron Database Structure Analysis

## Database Overview
- **Type**: SQLite
- **Size**: 90,112 bytes (~88 KB)
- **Location**: `db/haxbotron.sqlite.db`
- **ORM**: TypeORM with synchronization enabled
- **Optimizations**: WAL mode, 64MB cache, memory temp store

## Database Tables & Entities

### 1. **Player** (Core player statistics)
```typescript
- uid: number (PK, auto-increment)
- ruid: string (Room UID) [Indexed]
- auth: string (Haxball auth ID) [Indexed]
- conn: string (Connection ID)
- name: string (Player name)
- rating: number (ELO rating) [Indexed]
- totals: number (Total games)
- disconns: number (Disconnections)
- wins: number (Games won)
- goals: number (Goals scored)
- assists: number (Assists made)
- ogs: number (Own goals)
- losePoints: number (Goals conceded)
- balltouch: number (Ball touches)
- passed: number (Passes made)
- mute: boolean (Mute status)
- muteExpire: number (Mute expiration)
- rejoinCount: number (Rejoin attempts)
- joinDate: number (First join timestamp)
- leftDate: number (Last leave timestamp)
- malActCount: number (Malicious activity count)
```

### 2. **MatchSummary** (Match records)
```typescript
- id: number (PK, auto-increment)
- ruid: string (Room UID)
- matchId: string (Unique match identifier)
- totalMatchTime: number (Match duration)
- team1Players: string[] (Team 1 player list)
- team2Players: string[] (Team 2 player list)
- serverRuid: string (Server room UID)
- timestamp: number (Match timestamp)
```

### 3. **MatchEvent** (Detailed match events)
```typescript
- ruid: string (PK, Room UID)
- matchId: string (PK, Match ID)
- playerAuth: string (PK, Player auth)
- timestamp: number (PK, Event timestamp)
- playerTeamId: number (Player team)
- matchTime: number (Time in match)
- eventType: string ('goal' | 'assist' | 'ownGoal')
```

### 4. **BanList** (Player bans)
```typescript
- uid: number (PK, auto-increment)
- ruid: string (Room UID)
- auth: string (Player auth, nullable)
- conn: string (Connection ID)
- reason: string (Ban reason)
- register: number (Ban timestamp)
- expire: number (Expiration, -1 = permanent)
- adminAuth: string (Admin who banned, nullable)
- adminName: string (Admin name, nullable)
- playerName: string (Banned player name, nullable)
```

### 5. **MuteList** (Player mutes)
```typescript
- uid: number (PK, auto-increment)
- ruid: string (Room UID)
- auth: string (Player auth, nullable)
- conn: string (Connection ID)
- reason: string (Mute reason)
- register: number (Mute timestamp)
- expire: number (Expiration, -1 = permanent)
- adminAuth: string (Admin who muted, nullable)
- adminName: string (Admin name, nullable)
```

### 6. **SuperAdmin** (Super admin keys)
```typescript
- uid: number (PK, auto-increment)
- ruid: string (Room UID)
- key: string (Admin key)
- description: string (Key description)
```

### 7. **Connection** (Connection tracking & anti-spam)
```typescript
- id: number (PK, auto-increment)
- ruid: string (Room UID)
- conn: string (Connection ID) [Indexed]
- auth: string (Player auth, nullable)
- playerName: string (Last used name)
- ipAddress: string (IP address, nullable)
- country: string (Country, nullable)
- region: string (Region, nullable)
- city: string (City, nullable)
- latitude: number (Latitude, nullable)
- longitude: number (Longitude, nullable)
- isp: string (ISP, nullable)
- timezone: string (Timezone, nullable)
- isVpn: boolean (VPN detection)
- isSuspicious: boolean (Suspicious activity flag)
- spamScore: number (Spam score)
- joinCount: number (Join count)
- kickCount: number (Kick count)
- banCount: number (Ban count)
- aliases: string (JSON string of aliases)
- spamPatterns: string (JSON string of spam patterns)
- firstSeen: Date (First seen timestamp)
- lastSeen: Date (Last seen timestamp)
- lastActivity: Date (Last activity timestamp)
```

## Database Indexes
- `Player`: ruid+rating, ruid+auth, ruid, auth, rating
- `Connection`: conn, ruid+conn

## API Structure
- **REST API**: Koa.js server on port 13001
- **Routes**: `/api/v1/*` for all endpoints
- **Controllers**: Separate controllers for each entity
- **Repositories**: Repository pattern for data access
- **Models**: TypeScript interfaces for data transfer

## Database Optimizations
- **WAL Mode**: Write-Ahead Logging for better concurrency
- **64MB Cache**: Large cache for better performance
- **Memory Temp Store**: Temporary data in memory
- **Query Caching**: 30-second cache duration
- **Indexes**: Strategic indexes on frequently queried fields

## Potential Issues & Recommendations

### 1. **Over-Engineering**
- **Connection table**: Very detailed geolocation data that may not be used
- **Complex spam detection**: Multiple fields for spam tracking
- **Redundant data**: Some fields duplicated across tables

### 2. **Data Redundancy**
- Player names stored in multiple tables
- Auth/conn stored in both Player and ban/mute tables
- Match data split between MatchSummary and MatchEvent

### 3. **Potential Simplifications**
- **Connection table**: Could be simplified to just track basic connection info
- **Geolocation data**: Remove if not actively used for moderation
- **Spam tracking**: Simplify to basic counters
- **Match events**: Consider if detailed event tracking is necessary

### 4. **Storage Efficiency**
- Current size (88KB) is very reasonable
- Most complexity is in Connection table with geolocation
- Could reduce by 30-40% by removing unused geolocation fields

## Recommendations for Cleanup

### High Priority
1. **Remove unused geolocation fields** from Connection table if not used
2. **Simplify spam detection** to basic counters
3. **Remove redundant player name storage** across tables

### Medium Priority
1. **Consolidate match data** if detailed events aren't needed
2. **Review Connection table necessity** - might be over-engineered
3. **Add data retention policies** for old matches/events

### Low Priority
1. **Optimize indexes** based on actual query patterns
2. **Consider data archiving** for very old records
3. **Review API endpoint usage** and remove unused ones

## Current Assessment
The database structure is **well-designed but over-engineered** for a Haxball bot. The Connection table with full geolocation tracking seems excessive unless actively used for advanced moderation. The core Player, MatchSummary, BanList, and SuperAdmin tables are appropriate and necessary.