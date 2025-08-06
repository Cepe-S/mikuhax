import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function cmdMemide(byPlayer: PlayerObject): void {
    // Cooldown management (15 seconds as in the original example)
    const now = Date.now();
    const cooldownTime = 15000; // 15 seconds
    
    if (!window.gameRoom.memideCooldowns) {
        window.gameRoom.memideCooldowns = new Map();
    }
    
    if (!window.gameRoom.memideUsedValues) {
        window.gameRoom.memideUsedValues = new Map();
    }
    
    const lastUsed = window.gameRoom.memideCooldowns.get(byPlayer.id);
    if (lastUsed && (now - lastUsed) < cooldownTime) {
        const remainingTime = Math.ceil((cooldownTime - (now - lastUsed)) / 1000);
        window.gameRoom._room.sendAnnouncement(
            `⚠️ Espera unos segundos antes de usar este comando nuevamente.`,
            byPlayer.id,
            0xFFFF00,
            "bold",
            2
        );
        return;
    }
    
    window.gameRoom.memideCooldowns.set(byPlayer.id, now);
    
    // Categories of responses exactly as in the JavaScript example
    const comentarios = {
        micropene: [
            "¡Es más fácil encontrar a Wally que eso!",
            "¡Ese tiene que ser el Minion más pequeño que existe!",
            "¡Eso no es un pito, es un error de la fábrica!",
            "¿Necesitas pinzas para manejar eso?",
            "¡Es tan chiquito que ni el Viagra lo encuentra!",
            "¡Eso es más chico que la autoestima de un cornudo!",
            "¡Necesitás un microscopio para ver esa mierda!",
            "¡Parece que la madre naturaleza se quedó sin material!",
            "¡Eres la definición viviente de 'chiquito pero peligroso'!"
        ],
        debajoPromedio: [
            "¡Tranquilo! No todos pueden ser estrellas porno.",
            "¡A veces menos es más... o eso dicen!",
            "¡La compensación viene en otras áreas, amigo!",
            "¡No te preocupes, el carisma lo es todo!",
            "¡Vos te bajás los pantalones y sube la autoestima de todos!",
            "¡Con eso no hacés ni cosquillas!",
            "¡Eso es tan chico que ni para mear bien sirve!"
        ],
        promedio: [
            "¡Ni muy grande ni muy pequeño, perfecto para cualquier agujero!",
            "¡Eres el término medio, el equilibrio perfecto!",
            "¡Lo importante es cómo lo usas, dicen por ahí!",
            "¡No es el tamaño, es cómo lo mueves!",
            "¡Lo justo para no pasar vergüenza, pero tampoco para presumir!",
            "¡Cumplís, pero sin pena ni gloria!"
        ],
        encimaPromedio: [
            "¡Tenés un misil entre las piernas!",
            "¡El tamaño sí importa, y lo sabes!",
            "¡Te bajás los pantalones y aplauden!",
            "¡Con eso podés asustar hasta a King Kong!",
            "¡Tremenda anaconda tenes ahí!",
            "¡Te bajás los pantalones y parece una película porno!",
            "¡Con esa cosa puedes hacer feliz a varias de una vez!",
            "¡Cuidado, que eso podría necesitar un permiso de armas!"
        ],
        grande: [
            "¡Con eso hasta los caballos te respetan!",
            "¡Con eso podés colgar la ropa de toda la cuadra!",
            "¡Eso sí que es un 'paquete' de verdad!",
            "¡Eres el orgullo del Host!",
            "¡Con eso puedes hacer sombras en un día soleado!",
            "¡Eso podría causar un eclipse solar!",
            "¡Eso no es un pene, es un arma de destrucción masiva!"
        ]
    };
    
    // Function to get comment based on value (exactly as in JavaScript example)
    function obtenerComentario(valor: number): string {
        if (valor >= 1 && valor <= 7) {
            return comentarios.micropene[Math.floor(Math.random() * comentarios.micropene.length)];
        } else if (valor > 7 && valor <= 12) {
            return comentarios.debajoPromedio[Math.floor(Math.random() * comentarios.debajoPromedio.length)];
        } else if (valor > 12 && valor <= 16) {
            return comentarios.promedio[Math.floor(Math.random() * comentarios.promedio.length)];
        } else if (valor > 16 && valor <= 20) {
            return comentarios.encimaPromedio[Math.floor(Math.random() * comentarios.encimaPromedio.length)];
        } else {
            return comentarios.grande[Math.floor(Math.random() * comentarios.grande.length)];
        }
    }
    
    // Check if player already has a value assigned
    const existingValue = window.gameRoom.memideUsedValues.get(byPlayer.id);
    
    if (existingValue !== undefined) {
        // If player already used the command, send the previously assigned value with a comment
        const comentario = obtenerComentario(existingValue);
        window.gameRoom._room.sendAnnouncement(
            `📏 A ${byPlayer.name} le mide ${existingValue} cm 🍌 ${comentario}`,
            null,
            0xFFFFFF,
            "bold",
            1
        );
    } else {
        // Generate a new random value between 1 and 30 with decimals
        let randomValue = Math.random() * (30 - 1) + 1;
        // Round to one decimal place
        randomValue = Math.round(randomValue * 10) / 10;
        // Store the assigned value for the player
        window.gameRoom.memideUsedValues.set(byPlayer.id, randomValue);
        // Get a comment based on the new value
        const comentarioNuevo = obtenerComentario(randomValue);
        // Send announcement with the new value and comment
        window.gameRoom._room.sendAnnouncement(
            `📏 A ${byPlayer.name} le mide ${randomValue} cm 🍌 ${comentarioNuevo}`,
            null,
            0xFFFFFF,
            "bold",
            1
        );
    }
}
