export interface GameCommands {
    _commandPrefix: string

    _helpManabout: string
    _helpManafk: string
    _helpManfreeze: string
    _helpManhelp: string
    _helpManlist: string
    _helpManmute: string
    _helpManposs: string
    _helpManscout: string
    _helpManstats: string
    _helpManstatsreset: string
    _helpManstreak: string
    _helpManvote: string
    _helpMantier: string
    _helpMansuper: string
    _helpMannotice: string
    _helpManpowershotadmin: string
    _helpMangoleadores: string
    _helpManasistidores: string
    _helpManranking: string
    _helpManavatar: string
    _helpManmap: string

    _listSubafk: string
    _listSubmute: string
    _listSubred: string
    _listSubblue: string
    _listSubspec: string

    _superSublogin: string
    _superSublogout: string
    _superSubthor: string
    _superSubthordeprive: string
    _superSubkick: string
    _superSubban: string

    _disabledCommandList?: string[]

    about: string
    afk: string
    freeze: string
    help: string
    list: string
    mute: string
    poss: string
    scout: string
    stats: string
    statsreset: string
    streak: string
    super: string
    vote: string
    tier: string
    notice: string
    powershotadmin: string
    goleadores: string
    asistidores: string
    ranking: string
    avatar: string
    map: string
}