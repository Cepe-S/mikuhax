// YOU CAN USE A PLACEHOLDER FOR INTERPOLATION. FOR EXAMPLE, 'Hello, My name is {name}'
// THE TYPES OF PLACEHOLDER ARE LIMITED BY STRING SET.

export const scheduler = {
    advertise: '📢 Miku Server\n💬 [Discord] https://discord.gg/qfg45B2 [Donar] https://www.patreon.com/dapucita'
    ,shutdown: '📢 La sala se cerrará pronto. Gracias por usarla.'
    ,afkKick: '📢 Expulsado por inactividad.'
    ,afkCommandTooLongKick: '📢 Expulsado por estar inactivo más de 2 minutos.'
    ,afkDetect: '📢 @{targetName}#{targetID} está inactivo. Presiona cualquier tecla. Si continúas inactivo, podrías ser expulsado.'
    ,autoUnmute: '🔊 Se ha desactivado el silencio de {targetName}#{targetID} automáticamente.'
    ,banVoteAutoNotify: '🗳️ Se está llevando a cabo una votación para expulsar (!vote #ID): {voteList}'
}

export const teamName = {
    specTeam: 'Espectador'
    ,redTeam: 'Rojo'
    ,blueTeam: 'Azul'
}

export const antitrolling = {
    joinFlood: {
        banReason: '🚫 Reconexiones frecuentes (5 minutos).'
        ,floodWarning: '📢 Reconectarte muy rápido puede causar que seas expulsado.'
    }
    ,chatFlood: {
        muteReason: '🔇 {playerName}#{playerID} ha sido silenciado por spam en el chat (3 minutos). Un administrador puede quitar el silencio.'
    }
    ,ogFlood: {
        banReason: '🚫 Autogoles consecutivos (10 minutos).'
    }
    ,banNoPermission: {
        banReason: '🚫 Prohibido baneo permanente (30 segundos).'
    }
    ,kickAbusing: {
        banReason: '🚫 Expulsiones frecuentes de jugadores (5 minutos).'
        ,abusingWarning: '📢 Expulsar demasiado rápido puede causar que seas expulsado.'
    }
    ,insufficientStartAbusing: {
        banReason: '🚫 Falta de jugadores en el equipo (5 minutos).'
        ,abusingWarning: '📢 Continuar jugando sin suficientes jugadores puede causar que seas expulsado.'
    }
    ,afkAbusing: {
        cannotReason: '❌ No puedes estar inactivo durante el juego.'
    }
    ,gameAbscond: {
        banReason: '🚫 Abandonar el juego (5 minutos).'
    }
    ,malAct: {
        banReason: '🚫 Detección de comportamiento malintencionado.'
    }
}



export const command = {
    _ErrorWrongCommand : '❌ Comando incorrecto. 📑 Usa !help o !help COMMAND para más detalles.'
    ,_ErrorNoPermission: '❌ Solo los administradores pueden usar este comando.'
    ,_ErrorDisabled: '❌ Este comando no está habilitado en esta sala.'
    ,help: '📄 !about, notice, stats, statsreset, tier, afk, vote, poss, streak, scout, list, powershot\n📑 Usa !help COMMAND para más detalles (Ej: !help stats)\n📑 Usa !help admin para ver los comandos de administrador.'
    ,helpadmin: '📄 !freeze, mute, powershotadmin\n📑 Usa !help COMMAND para más detalles'
    ,helpman: { // descripción detallada para un comando
        _ErrorWrongMan : '❌ No hay una descripción disponible para el comando solicitado.'
        ,help: '📑 !help COMMAND : Muestra detalles sobre el comando COMMAND.'
        ,about: '📑 !about : Muestra información sobre el bot.'
        ,stats: '📑 !stats : Muestra las estadísticas y la puntuación. Usa !statsreset para reiniciarlas.\n📑 !stats #ID : Muestra las estadísticas del jugador con el ID especificado. El ID debe ser un número. (Ej: !stats #12)\n📑 Usa !list red,blue,spec para obtener el ID numérico.'
        ,statsreset: '📑 !statsreset : Reinicia las estadísticas y la puntuación. No se puede recuperar después.'
        ,poss: '📑 !poss : Muestra la posesión del balón de ambos equipos.'
        ,streak: '📑 !streak : Muestra el equipo con racha ganadora actual y la cantidad de victorias consecutivas.'
        ,afk: '📑 !afk MSG : Activa o desactiva el modo ausente. Puedes incluir una razón en MSG. Si estás ausente demasiado tiempo, podrías ser expulsado.'
        ,list: '📑 !list red/blue/spec : Muestra la lista de jugadores en ese equipo con información básica.\n📑 !list mute : Muestra la lista de jugadores silenciados.\n📑 !list afk : Muestra la lista de jugadores ausentes.'
        ,freeze: '📑 !freeze : Activa o desactiva el bloqueo de chat global. Solo administradores pueden usarlo.'
        ,mute: '📑 !mute #ID : Silencia o des-silencia al jugador con el ID especificado. El ID debe ser un número. (Ej: !mute #12)\n📑 Usa !list red,blue,spec,mute para obtener el ID numérico.'
        ,scout: '📑 !scout : Muestra las probabilidades de victoria esperadas de cada equipo basado en una fórmula modificada de victorias Pythagorean. No compara directamente los equipos.'
        ,vote: '📑 !vote : Muestra el estado actual de la votación y tu estado de voto.\n📑 !vote #ID : Vota o cancela un voto para expulsar al jugador con el ID especificado. El ID debe ser un número. (Ej: !vote #12)'
        ,tier: '📑 !tier : Muestra información sobre el sistema de niveles y puntuación.'
        ,notice: '📑 !notice : Muestra los avisos actuales.'
        ,powershotadmin: '📑 !powershotadmin <on|off> : [ADMIN] Activa/desactiva el sistema de powershot automático.'
    } 
    ,about: '📄 Nombre de la sala : {RoomName} ({_LaunchTime})\n💬 Esta sala está gestionada por el bot Haxbotron🤖 (https://dapucita.github.io/haxbotron/)\n💬 [Discord] https://discord.gg/qfg45B2 [Apóyanos] https://www.patreon.com/dapucita'
    ,stats: {
        _ErrorNoPlayer: '❌ No está conectado. Debes especificar un ID en el formato #número. (Ej: !stats #12)\n📑 Usa !list red,blue,spec para obtener el ID numérico.'
        ,statsMsg: '📊 Estadísticas de {targetName}#{ticketTarget} (Puntuación {targetStatsRatingAvatar}{targetStatsRating}): {targetStatsTotal} partidos jugados (victorias {targetStatsWinRate}%), desconexiones {targetStatsDisconns}\n📊 Goles {targetStatsGoals}, asistencias {targetStatsAssists}, goles en contra {targetStatsOgs}, goles recibidos {targetStatsLosepoints}, pases exitosos {targetStatsPassSuccess}%\n📊 Promedios por partido: {targetStatsGoalsPerGame} goles, {targetStatsAssistsPerGame} asistencias, {targetStatsOgsPerGame} goles en contra, {targetStatsLostGoalsPerGame} goles recibidos.'
        ,matchAnalysis: '📊 En este partido: {targetStatsNowGoals} goles, {targetStatsNowAssists} asistencias, {targetStatsNowOgs} goles en contra. (Pases exitosos {targetStatsNowPassSuccess}%)'
    }
    ,statsreset: '📊 Las estadísticas han sido reiniciadas. No se pueden recuperar.'
    ,poss: '📊 Posesión: Red {possTeamRed}%, Blue {possTeamBlue}%.'
    ,streak: '📊 El equipo {streakTeamName} lleva {streakTeamCount} victorias consecutivas.'
    ,afk: {
        _WarnAfkTooLong: '📢 Podrías ser expulsado si estás ausente por demasiado tiempo (2 minutos).'
        ,setAfk: '💤 {targetName}#{ticketTarget} está ahora ausente... ({targetAfkReason})'
        ,unAfk: '📢 {targetName}#{ticketTarget} ha regresado de su estado ausente.'
        ,muteNotifyWarn: '❌ Si estás silenciado, los demás jugadores no verán tu notificación de ausencia.'
        ,startRecord: '📊 Hay suficientes jugadores. Las estadísticas ahora se registrarán.'
        ,stopRecord: '📊 Se necesitan al menos {gameRuleNeedMin} jugadores. Las estadísticas no se registrarán por ahora.'
    }
    ,mute: {
        _ErrorNoPermission: '❌ Solo los administradores pueden usar este comando.'
        ,_ErrorNoPlayer: '❌ No está conectado. Debes especificar un ID en el formato #número. (Ej: !mute #12)\n📑 Usa !list red,blue,spec,mute para obtener el ID numérico.'
        ,successMute: '🔇 {targetName}#{ticketTarget} ha sido silenciado por 3 minutos. Usa el comando nuevamente para des-silenciar.'
        ,successUnmute: '🔊 {targetName}#{ticketTarget} ha sido des-silenciado.'
        ,muteAbusingWarn: '❌ No puedes silenciar a este jugador inmediatamente (3 minutos de espera necesarios).'
    }
    ,super: {
        _ErrorWrongCommand: '❌ Comando de superadministrador incorrecto.'
        ,_ErrorNoPermission: '❌ Solo los superadministradores pueden usar este comando.'
        ,_ErrorLoginAlready: '❌ Ya eres superadministrador. Usa !super logout para cerrar sesión.'
        ,defaultMessage: '📄 Comandos super para administrar el bot Haxbotron.'
        ,loginSuccess: '🔑 Sesión iniciada. Ahora tienes permisos de superadministrador.'
        ,logoutSuccess: '🔑 Sesión cerrada. Has renunciado a los permisos de superadministrador.'
        ,loginFail: '❌ Error al iniciar sesión.'
        ,loginFailNoKey: '❌ Error al iniciar sesión. Debes proporcionar una clave de autenticación.'
        ,thor: {
            noAdmins: '❌ No quedan jugadores con permisos de administrador para revocar.'
            ,complete: '🔑 Has adquirido permisos de administrador estándar.'
            ,deprive: '🔑 Has revocado los permisos de otro administrador estándar y los has adquirido.'
        }
        ,kick: {
            noID: '❌ ID del jugador incorrecto. No se puede expulsar. Usa el formato #número. (Ej: !super kick #12)'
            ,kickMsg: '📢 Expulsión'
            ,kickSuccess: '📢 El jugador ha sido expulsado.'
        }
        ,ban: {
            noID: '❌ ID del jugador incorrecto. No se puede prohibir permanentemente. Usa el formato #número. (Ej: !super ban #12)'
            ,banMsg: '📢 Prohibición permanente'
            ,banSuccess: '📢 El jugador ha sido prohibido permanentemente.'
        }
        ,banclear: {
            noTarget: '❌ Formato incorrecto para borrar la lista de prohibidos. Actualmente solo se admite: 📑 !super banclear all.'
            ,complete: '🔑 Lista de prohibidos borrada.'
        }
        ,banlist: {
            _ErrorNoOne: '❌ No hay nadie en la lista.'
            ,whoisList: '📜 {whoisResult}'
        }
    }
    ,list: {
        _ErrorNoTeam: '❌ Debes especificar el tipo de lista: red, blue, spec, mute, afk. (Ej: !list red)'
        ,_ErrorNoOne: '❌ La lista está vacía.'
        ,whoisList: '📜 {whoisResult}'
    }
    ,freeze: {
        _ErrorNoPermission : '❌ Solo los administradores pueden usar este comando.'
        ,onFreeze: '🔇 El administrador ha deshabilitado el chat global. Los comandos aún están disponibles. 📄 !help'
        ,offFreeze: '🔊 El administrador ha habilitado el chat global. Ahora puedes hablar.' 
    }
    ,scout: {
        _ErrorNoMode : '❌ No hay suficientes jugadores para calcular las probabilidades de victoria.'
        ,scouting: '📊 Probabilidad de victoria Pythagorean: Equipo Red {teamExpectationRed}%, Equipo Blue {teamExpectationBlue}%, Espectadores {teamExpectationSpec}%.'
    }
    ,vote: {
        _ErrorNoPlayer: '❌ No estás conectado. Debes especificar en el formato #ID (ej: !vote #12)'
        ,_ErrorNoPermission: '❌ No hay suficientes jugadores para votar.'
        ,voteBanMessage: '🚫 Expulsión por votación (30 minutos)'
        ,voteComplete: '🗳️ Se ha realizado una votación de expulsión para {targetName}#{targetID}. Puedes cancelar la votación usando el comando nuevamente.'
        ,voteCancel: '🗳️ Se ha cancelado la votación de expulsión para {targetName}#{targetID}.'
        ,voteIntroduce : '🗳️ Puedes votar para expulsar a un jugador o cancelar la votación. (ej: !vote #12)'
        ,voteStatus : '🗳️ Actualmente hay una votación de expulsión para {targetName}#{targetID}.'
        ,voteAutoNotify: '🗳️ Actualmente está en curso una votación de expulsión: {voteList}'
    }
    ,tier: '📄 El tier se determina según el puntaje de rating. Puedes ver el puntaje con el comando !stats.\n📑 {tierAvatar9}{tierCutoff9} {tierAvatar8}{tierCutoff8} {tierAvatar7}{tierCutoff7} {tierAvatar6}{tierCutoff6} {tierAvatar5}{tierCutoff5} {tierAvatar4}{tierCutoff4} {tierAvatar3}{tierCutoff3} {tierAvatar2}{tierCutoff2} {tierAvatar1}{tierCutoff1}'
    ,notice: {
        _ErrorNoMessage: '❌ No hay avisos disponibles actualmente.'
    }
}

export const funcUpdateAdmins = {
    newAdmin: '📢 {playerName}#{playerID} ha sido asignado como nuevo administrador.\n📑 No puede cambiar el mapa ni expulsar permanentemente a otros jugadores.\n📑 Escribe !help admin para ver los comandos disponibles para administradores.'
}

export const onJoin = {
    welcome: '📢 ¡Bienvenido {playerName}#{playerID}! 📄 Usa !help para ver los comandos de ayuda.'
    ,changename: '📢 {playerName}#{playerID} ha cambiado su nombre de {playerNameOld}.'
    ,startRecord: '📊 Se ha reunido suficiente gente. A partir de ahora, los registros se guardarán.'
    ,stopRecord: '📊 Se necesitan al menos {gameRuleNeedMin} jugadores. Actualmente, no se están registrando estadísticas.'
    ,doubleJoinningMsg: '🚫 {playerName}#{playerID} ha iniciado sesión en varias cuentas.'
    ,doubleJoinningKick: '🚫 Expulsado por inicio de sesión duplicado'
    ,tooLongNickname: '🚫 Nombre de usuario demasiado largo'
    ,duplicatedNickname: '🚫 Nombre de usuario duplicado'
    ,bannedNickname: '🚫 Nombre de usuario prohibido'
    ,includeSeperator: '🚫 Nombre de usuario prohibido (|,|)'
    ,banList: {
        permanentBan: '{banListReason}'
        ,fixedTermBan: '{banListReason}'
    }
}

export const onLeft = {
    startRecord: '📊 Se ha reunido suficiente gente. A partir de ahora, las estadísticas serán registradas.'
    ,stopRecord: '📊 Se necesitan al menos {gameRuleNeedMin} jugadores. Actualmente, las estadísticas no se están registrando.'
}

export const onChat = {
    mutedChat: '🔇 Estás silenciado y no puedes chatear. Los comandos aún pueden ser usados.'
    ,tooLongChat: '🔇 El mensaje es demasiado largo.'
    ,bannedWords: '🚫 El mensaje contiene palabras prohibidas.'
    ,includeSeperator: '🚫 El mensaje contiene palabras prohibidas (|,|).'
}

export const onTeamChange = {
    afkPlayer: '🚫 {targetPlayerName}#{targetPlayerID} está inactivo y no puede cambiar de equipo. ({targetAfkReason})'
}

export const onStart = {
    startRecord: '📊 Se ha reunido suficiente gente. A partir de ahora, los registros se guardarán.'
    ,stopRecord: '📊 Se necesitan al menos {gameRuleNeedMin} jugadores. Actualmente, no se están registrando estadísticas.'
    ,expectedWinRate: '📊 La tasa de ganancia esperada para el equipo rojo es {teamExpectationRed}%, y para el equipo azul es {teamExpectationBlue}%. (No es una comparación entre ambos equipos)'
}

export const onStop = {
    feedSocialDiscordWebhook: {
        replayMessage: '💽 Archivo de repetición de {roomName} ({replayDate})'
    }
}

export const powershot = {
    activated: '🔥 ¡POWERSHOT ACTIVADO! La pelota ahora tiene más potencia.',
    executed: '⚡ ¡{playerName}#{playerID} ejecutó un POWERSHOT!'
}

export const onVictory = {
    victory: '🎉 ¡Fin del partido! ¡El marcador es {redScore}:{blueScore}!! ⚽️'
    ,burning: '🔥 El equipo {streakTeamName} está en una racha de {streakTeamCount} victorias consecutivas!!'
    ,reroll: '📢 Felicitaciones por {streakTeamCount} victorias consecutivas. Los equipos se mezclarán automáticamente.'
}

export const onKick = {
    cannotBan: '🚫 Solo puedes expulsar temporalmente. La expulsión permanente ha sido cancelada.'
    ,notifyNotBan: '🚫 La expulsión permanente de {kickedName}#{kickedID} ha sido cancelada. Puede volver a unirse.'
}

export const onStadium = {
    loadNewStadium: '📁 Se ha abierto un nuevo mapa: {stadiumName}.'
    ,cannotChange: '🚫 No se puede cambiar el mapa.'
}

export const onTouch = {

}

export const onGoal = {
    goal: '⚽️ ¡Gol de {scorerName}#{scorerID}!'
    ,goalWithAssist: '⚽️ ¡Gol de {scorerName}#{scorerID}! {assistName}#{assistID} asistió.'
    ,og: '⚽️ {ogName}#{ogID} anotó un gol en propia puerta...'
}

export const onAdminChange = {
    afknoadmin: '🚫 Los jugadores inactivos no pueden ser administradores.'
}

export const onGamePause = {
    readyForStart: '📢 ¡El partido comenzará pronto!'
}
