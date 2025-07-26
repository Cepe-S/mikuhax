export function generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getUnixTimestamp(): number {
    return Math.floor(Date.now() / 1000);
}
