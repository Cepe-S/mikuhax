export interface GameRoomSettings {
    maliciousBehaviourBanCriterion: number

    banVoteEnable : boolean
    banVoteBanMillisecs : number
    banVoteAllowMinimum : number
    banVoteExecuteMinimum : number

    afkCountLimit : number

    afkCommandAutoKick : boolean
    afkCommandAutoKickAllowMillisecs : number

    chatFiltering : boolean

    antiJoinFlood : boolean
    joinFloodAllowLimitation : number
    joinFloodIntervalMillisecs : number
    joinFloodBanMillisecs : number

    antiChatFlood : boolean
    chatFloodCriterion : number
    chatFloodIntervalMillisecs : number

    // Anti-spam mute system
    antiSpamMuteEnabled: boolean           // Activar sistema de muteo automático
    antiSpamMuteTimeMillisecs: number      // Tiempo de muteo (ej: 300000 = 5 min)
    antiSpamMuteLogEnabled: boolean        // Activar logging de muteos

    antiOgFlood : boolean
    ogFloodCriterion : number
    ogFloodBanMillisecs : number    

    antiBanNoPermission : boolean
    banNoPermissionBanMillisecs : number

    antiInsufficientStartAbusing : boolean
    insufficientStartAllowLimitation : number
    insufficientStartAbusingBanMillisecs : number

    antiPlayerKickAbusing : boolean
    playerKickAllowLimitation : number
    playerKickIntervalMillisecs : number
    playerKickAbusingBanMillisecs : number

    antiAFKFlood : boolean
    antiAFKAbusing : boolean

    antiMuteAbusing : boolean
    muteAllowIntervalMillisecs : number
    muteDefaultMillisecs : number

    antiGameAbscond : boolean
    gameAbscondBanMillisecs : number
    gameAbscondRatingPenalty : number

    rerollWinStreak : boolean
    rerollWinstreakCriterion : number

    guaranteePlayingTime : boolean
    guaranteedPlayingTimeSeconds : number

    avatarOverridingByTier : boolean

    nicknameLengthLimit : number
    chatLengthLimit : number

    forbidDuplicatedNickname: boolean
    nicknameTextFilter: boolean
    chatTextFilter: boolean

    // Ball physics settings
    ballRadius: number
    ballColor: string
    ballBCoeff: number
    ballInvMass: number
    ballDamping: number

    // Powershot system settings
    powershotEnabled: boolean
    powershotActivationTime: number  // Time in deciseconds (10 = 1 second)
    powershotNormalColor: number    // Ball normal color (hex)
    powershotActiveColor: number    // Ball powershot color (hex)
    powershotInvMassFactor: number  // Powershot force multiplier
    powershotCooldown: number       // Cooldown between powershot uses (milliseconds)
    powershotStickDistance: number  // Distance threshold to consider ball "stuck" to player

    // Balance system settings
    balanceEnabled: boolean
    balanceMode: string // balance mode: "jt" or "pro"
    balanceMaxPlayersPerTeam: number // maximum players per team for balance
}
