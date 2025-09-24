export function onRoomLinkListener(url: string): void {
    window.gameRoom.link = url;
    window.gameRoom.logger.i('onRoomLink', `Room link generated: ${url}`);
    
    // Initialize stadium now that room is fully ready
    if (window.gameRoom.stadiumManager) {
        window.gameRoom.stadiumManager.initialize();
        window.gameRoom.logger.i('onRoomLink', 'Stadium manager initialized after room ready');
    }
}