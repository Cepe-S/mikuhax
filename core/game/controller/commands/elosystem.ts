import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function cmdEloSystem(byPlayer: PlayerObject): void {
    const eloSystemInfo = `
🏆 SISTEMA ELO MEJORADO 🏆

📈 MEJORAS IMPLEMENTADAS:
• Los ganadores SIEMPRE ganan ELO (mínimo garantizado)
• Factores K aumentados para mayor distribución:
  - Placement: 200 (antes 150)
  - Normal: 60 (antes 40)
  - Reemplazo: 30 (antes 20)

🎯 NUEVA DISTRIBUCIÓN DE TIERS:
• Bronce: < 300 pts (antes < 400)
• Plata: 300-500 pts (antes 400-600)
• Oro: 500-750 pts (antes 600-800)
• Platino: 750-1000 pts (antes 800-1000)
• Esmeralda: 1000-1300 pts (antes 1000-1200)
• Diamante: 1300-1650 pts (antes 1200-1400)
• Maestro: 1650-2000 pts (antes 1400-1600)
• Challenger: 2000+ pts (antes 1600+)
• TOP 20: Rankings especiales

⚡ BENEFICIOS:
• Mayor dispersión de jugadores en todos los rangos
• Progreso más satisfactorio al ganar partidos
• Sistema TOP 20 consistente y competitivo
• Pérdidas limitadas para evitar frustraciones

Use !ranking para ver el TOP 20 actual.
    `.trim();

    window.gameRoom._room.sendAnnouncement(eloSystemInfo, byPlayer.id, 0x00FF88, "normal", 1);
}
