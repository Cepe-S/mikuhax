export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}

export class Logger {
    // written in Singleton Pattern
    // If the bot created Logger object once, never create ever until the bot instance dead. 
    private static instance: Logger;
    private logLevel: LogLevel = LogLevel.INFO;
    private rateLimitMap: Map<string, { count: number; lastReset: number }> = new Map();
    private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
    private readonly RATE_LIMIT_MAX = 50; // Max 50 logs per minute per origin
    private readonly VERBOSE_ORIGINS = new Set([
        'LocalConnectionTracker',
        'onGameTick',
        'QueueSystem',
        'TeamBalancer'
    ]);

    private Logger() { } // not use
    
    public static getInstance(): Logger {
        if (this.instance == null) {
            this.instance = new Logger();
        }
        return this.instance;
    }

    public setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    private shouldLog(level: LogLevel, origin: string): boolean {
        // Check log level
        if (level > this.logLevel) {
            return false;
        }

        // Skip verbose origins for INFO level unless it's ERROR or WARN
        if (level === LogLevel.INFO && this.VERBOSE_ORIGINS.has(origin)) {
            return false;
        }

        // Rate limiting
        const now = Date.now();
        const key = `${origin}_${level}`;
        const rateData = this.rateLimitMap.get(key);

        if (!rateData) {
            this.rateLimitMap.set(key, { count: 1, lastReset: now });
            return true;
        }

        // Reset counter if window expired
        if (now - rateData.lastReset > this.RATE_LIMIT_WINDOW) {
            rateData.count = 1;
            rateData.lastReset = now;
            return true;
        }

        // Check rate limit
        if (rateData.count >= this.RATE_LIMIT_MAX) {
            return false;
        }

        rateData.count++;
        return true;
    }

    public i(origin: string, msg: string): void { // for common info log
        if (!this.shouldLog(LogLevel.INFO, origin)) {
            return;
        }
        console.info(msg);
        window._emitSIOLogEvent(origin, 'info', msg);
    }

    public e(origin: string, msg: string): void { // for error log
        if (!this.shouldLog(LogLevel.ERROR, origin)) {
            return;
        }
        console.error(msg);
        window._emitSIOLogEvent(origin, 'error', msg);
    }

    public w(origin: string, msg: string): void { // for warning log
        if (!this.shouldLog(LogLevel.WARN, origin)) {
            return;
        }
        console.warn(msg);
        window._emitSIOLogEvent(origin, 'warn', msg);
    }

    public d(origin: string, msg: string): void { // for debug log
        if (!this.shouldLog(LogLevel.DEBUG, origin)) {
            return;
        }
        console.debug(msg);
        window._emitSIOLogEvent(origin, 'debug', msg);
    }

    // Force log (bypasses rate limiting and level checks)
    public force(origin: string, level: 'info' | 'warn' | 'error', msg: string): void {
        switch(level) {
            case 'info':
                console.info(msg);
                break;
            case 'warn':
                console.warn(msg);
                break;
            case 'error':
                console.error(msg);
                break;
        }
        window._emitSIOLogEvent(origin, level, msg);
    }
}