export function onRoomLinkListener(url: string): void {
    window.gameRoom.link = url;
    window.gameRoom.logger.i('onRoomLink', `Room link generated: ${url}`);
}