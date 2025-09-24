import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@material-ui/core';
import { Button, Badge, Typography, Box, Grid, Chip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

interface BalanceAction {
    timestamp: number;
    action: string;
    playerId: number;
    playerName: string;
    fromTeam: number;
    toTeam: number;
    reason: string;
    mode: string;
    redCount: number;
    blueCount: number;
    queueLength?: number;
}

interface QueueEntry {
    playerId: number;
    playerAuth: string;
    playerName: string;
    joinTime: number;
    rating: number;
}

interface BalanceStatus {
    config: {
        mode: string;
        maxPlayersPerTeam: number;
        enabled: boolean;
    };
    redCount: number;
    blueCount: number;
    queueLength: number;
    queue: QueueEntry[];
    recentActions: BalanceAction[];
}

interface StadiumAction {
    timestamp: number;
    action: string;
    stadiumName: string;
    state: string;
    playerCount: number;
    minPlayers: number;
    reason: string;
}

interface StadiumStatus {
    currentStadium: string;
    currentState: string;
    playerCount: number;
    minPlayers: number;
    readyMap: string;
    gameMap: string;
    recentActions: StadiumAction[];
}

interface MatchAction {
    timestamp: number;
    action: string;
    playerName?: string;
    playerId?: number;
    details: string;
}

interface MatchStatus {
    isGaming: boolean;
    matchDuration: number;
    redScore: number;
    blueScore: number;
    redPlayers: number;
    bluePlayers: number;
    recentActions: MatchAction[];
}

interface DebugStatus {
    balance?: BalanceStatus;
    stadium?: StadiumStatus;
    match?: MatchStatus;
}

const useStyles = makeStyles((theme) => ({
    root: {
        padding: theme.spacing(2),
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
    },
    headerCard: {
        marginBottom: theme.spacing(3),
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
    },
    systemCard: {
        marginBottom: theme.spacing(2),
        height: 'fit-content',
    },
    statBox: {
        textAlign: 'center',
        padding: theme.spacing(1.5),
        backgroundColor: '#fff',
        borderRadius: theme.spacing(1),
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        margin: theme.spacing(0.5),
    },
    actionsList: {
        maxHeight: 300,
        overflow: 'auto',
        padding: theme.spacing(1),
    },
    actionItem: {
        padding: theme.spacing(1),
        marginBottom: theme.spacing(0.5),
        backgroundColor: '#fff',
        borderRadius: theme.spacing(0.5),
        borderLeft: '4px solid #ccc',
        fontSize: '0.85rem',
    },
    queueItem: {
        padding: theme.spacing(1),
        backgroundColor: '#fff',
        borderRadius: theme.spacing(0.5),
        marginBottom: theme.spacing(0.5),
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    sectionTitle: {
        fontWeight: 600,
        marginBottom: theme.spacing(1),
        color: '#333',
    },
}));

export function BalanceDebug() {
    const classes = useStyles();
    const { ruid } = useParams<{ ruid: string }>();
    const [debugStatus, setDebugStatus] = useState<DebugStatus | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [error, setError] = useState<string | null>(null);


    const fetchStatus = async () => {
        try {
            const response = await fetch(`/api/v1/room/${ruid}/debug/status`);
            if (response.ok) {
                const data = await response.json();
                setDebugStatus(data);
                setError(null);
            } else if (response.status === 404) {
                setError('Debug system not available');
                setAutoRefresh(false);
            }
        } catch (error) {
            setError('Failed to fetch debug status');
            console.error('Failed to fetch debug status:', error);
        }
    };

    useEffect(() => {
        fetchStatus();
        
        if (autoRefresh) {
            const interval = setInterval(fetchStatus, 5000); // Increased to 5 seconds
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    const getTeamName = (teamId: number) => {
        switch (teamId) {
            case 0: return 'SPEC';
            case 1: return 'RED';
            case 2: return 'BLUE';
            default: return 'UNK';
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'JT_ASSIGN': return 'bg-blue-500';
            case 'PRO_ASSIGN': return 'bg-green-500';
            case 'PRO_QUEUE': return 'bg-yellow-500';
            case 'PRO_REBALANCE': return 'bg-purple-500';
            case 'TEAM_CHANGE_BLOCKED': return 'bg-red-500';
            case 'CONFIG_CHANGE': return 'bg-gray-500';
            default: return 'bg-gray-400';
        }
    };

    if (error) {
        return (
            <div className={classes.root}>
                <Card className={classes.systemCard}>
                    <CardContent>
                        <Typography color="error">{error}</Typography>
                        <Button onClick={() => { setError(null); setAutoRefresh(true); fetchStatus(); }}>
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!debugStatus) {
        return <div>Loading debug information...</div>;
    }



    const renderBalanceSystem = () => {
        if (!debugStatus.balance) return null;
        const status = debugStatus.balance;
        
        return (
            <Card className={classes.systemCard}>
                <CardHeader 
                    title="Balance System" 
                    subheader={`Mode: ${status.config.mode.toUpperCase()} | Max per team: ${status.config.maxPlayersPerTeam}`}
                    action={
                        <Chip 
                            label={status.config.enabled ? 'ENABLED' : 'DISABLED'} 
                            color={status.config.enabled ? 'primary' : 'default'}
                            size="small"
                        />
                    }
                />
                <CardContent>
                    <Grid container spacing={1} style={{ marginBottom: 16 }}>
                        <Grid item xs={3}>
                            <div className={classes.statBox}>
                                <Typography variant="h5" style={{ color: '#f44336' }}>{status.redCount}</Typography>
                                <Typography variant="caption">Red</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={3}>
                            <div className={classes.statBox}>
                                <Typography variant="h5" style={{ color: '#2196f3' }}>{status.blueCount}</Typography>
                                <Typography variant="caption">Blue</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={3}>
                            <div className={classes.statBox}>
                                <Typography variant="h5" style={{ color: '#ff9800' }}>{status.queueLength}</Typography>
                                <Typography variant="caption">Queue</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={3}>
                            <div className={classes.statBox}>
                                <Typography variant="h5" style={{ color: '#4caf50' }}>{status.recentActions.length}</Typography>
                                <Typography variant="caption">Actions</Typography>
                            </div>
                        </Grid>
                    </Grid>
                    
                    <Grid container spacing={2}>
                        {status.queue.length > 0 && (
                            <Grid item xs={12} md={6}>
                                <Typography className={classes.sectionTitle}>Queue ({status.queue.length})</Typography>
                                <Box className={classes.actionsList}>
                                    {status.queue.slice(0, 5).map((entry, index) => (
                                        <div key={entry.playerId} className={classes.queueItem}>
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography variant="body2">#{index + 1} {entry.playerName}</Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {Math.round(entry.rating)} | {Math.round((Date.now() - entry.joinTime) / 1000)}s
                                                </Typography>
                                            </Box>
                                        </div>
                                    ))}
                                </Box>
                            </Grid>
                        )}
                        <Grid item xs={12} md={status.queue.length > 0 ? 6 : 12}>
                            <Typography className={classes.sectionTitle}>Recent Actions</Typography>
                            <Box className={classes.actionsList}>
                                {status.recentActions.slice(0, 8).map((action, index) => (
                                    <div key={index} className={classes.actionItem} style={{ borderLeftColor: getActionColor(action.action) }}>
                                        <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                                            <Chip label={action.action} size="small" style={{ fontSize: '0.7rem', height: 20 }} />
                                            <Typography variant="body2" style={{ flex: 1 }}>
                                                <strong>{action.playerName}</strong> {getTeamName(action.fromTeam)}→{getTeamName(action.toTeam)}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {formatTime(action.timestamp)}
                                            </Typography>
                                        </Box>
                                    </div>
                                ))}
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    const renderStadiumSystem = () => {
        if (!debugStatus.stadium) return null;
        const status = debugStatus.stadium;
        
        return (
            <Card className={classes.systemCard}>
                <CardHeader 
                    title="Stadium Manager" 
                    subheader={`Current: ${status.currentStadium.toUpperCase()}`}
                    action={
                        <Chip 
                            label={status.currentState.toUpperCase()} 
                            color={status.currentState === 'playing' ? 'primary' : 'default'}
                            size="small"
                        />
                    }
                />
                <CardContent>
                    <Grid container spacing={1} style={{ marginBottom: 16 }}>
                        <Grid item xs={3}>
                            <div className={classes.statBox}>
                                <Typography variant="h5" style={{ color: status.playerCount >= status.minPlayers ? '#4caf50' : '#f44336' }}>
                                    {status.playerCount}
                                </Typography>
                                <Typography variant="caption">Players</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={3}>
                            <div className={classes.statBox}>
                                <Typography variant="h5" style={{ color: '#ff9800' }}>{status.minPlayers}</Typography>
                                <Typography variant="caption">Min Req</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={3}>
                            <div className={classes.statBox}>
                                <Typography variant="body1" style={{ fontSize: '0.9rem' }}>{status.readyMap.toUpperCase()}</Typography>
                                <Typography variant="caption">Ready</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={3}>
                            <div className={classes.statBox}>
                                <Typography variant="body1" style={{ fontSize: '0.9rem' }}>{status.gameMap.toUpperCase()}</Typography>
                                <Typography variant="caption">Game</Typography>
                            </div>
                        </Grid>
                    </Grid>
                    
                    <Typography className={classes.sectionTitle}>Recent Actions</Typography>
                    <Box className={classes.actionsList}>
                        {status.recentActions.slice(0, 6).map((action, index) => (
                            <div key={index} className={classes.actionItem} style={{ borderLeftColor: '#4caf50' }}>
                                <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                                    <Chip label={action.action} size="small" style={{ fontSize: '0.7rem', height: 20 }} />
                                    <Typography variant="body2" style={{ flex: 1 }}>
                                        <strong>{action.stadiumName}</strong> → {action.state}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {formatTime(action.timestamp)}
                                    </Typography>
                                </Box>
                            </div>
                        ))}
                    </Box>
                </CardContent>
            </Card>
        );
    };

    const renderMatchSystem = () => {
        if (!debugStatus.match) return null;
        const status = debugStatus.match;
        
        return (
            <Card className={classes.systemCard}>
                <CardHeader 
                    title="Match System" 
                    subheader={`Duration: ${Math.floor(status.matchDuration / 60)}:${String(status.matchDuration % 60).padStart(2, '0')}`}
                    action={
                        <Chip 
                            label={status.isGaming ? 'PLAYING' : 'STOPPED'} 
                            color={status.isGaming ? 'primary' : 'default'}
                            size="small"
                        />
                    }
                />
                <CardContent>
                    <Grid container spacing={1} style={{ marginBottom: 16 }}>
                        <Grid item xs={3}>
                            <div className={classes.statBox}>
                                <Typography variant="h5" style={{ color: '#f44336' }}>{status.redScore}</Typography>
                                <Typography variant="caption">Red Score</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={3}>
                            <div className={classes.statBox}>
                                <Typography variant="h5" style={{ color: '#2196f3' }}>{status.blueScore}</Typography>
                                <Typography variant="caption">Blue Score</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={3}>
                            <div className={classes.statBox}>
                                <Typography variant="h5" style={{ color: '#f44336' }}>{status.redPlayers}</Typography>
                                <Typography variant="caption">Red Players</Typography>
                            </div>
                        </Grid>
                        <Grid item xs={3}>
                            <div className={classes.statBox}>
                                <Typography variant="h5" style={{ color: '#2196f3' }}>{status.bluePlayers}</Typography>
                                <Typography variant="caption">Blue Players</Typography>
                            </div>
                        </Grid>
                    </Grid>
                    
                    <Typography className={classes.sectionTitle}>Match Events</Typography>
                    <Box className={classes.actionsList}>
                        {status.recentActions.slice(0, 6).map((action, index) => (
                            <div key={index} className={classes.actionItem} style={{ borderLeftColor: '#ff9800' }}>
                                <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                                    <Chip label={action.action} size="small" style={{ fontSize: '0.7rem', height: 20 }} />
                                    <Typography variant="body2" style={{ flex: 1 }}>
                                        {action.playerName && <strong>{action.playerName}</strong>} {action.details}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {formatTime(action.timestamp)}
                                    </Typography>
                                </Box>
                            </div>
                        ))}
                    </Box>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className={classes.root}>
            <Card className={classes.headerCard}>
                <CardHeader
                    title="System Debug Dashboard"
                    subheader="Real-time monitoring of all game systems"
                    action={
                        <Box>
                            <Button
                                variant={autoRefresh ? "contained" : "outlined"}
                                size="small"
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                style={{ marginRight: 8, color: 'white', borderColor: 'white' }}
                            >
                                {autoRefresh ? 'Auto ON' : 'Auto OFF'}
                            </Button>
                            <Button 
                                variant="outlined" 
                                size="small" 
                                onClick={fetchStatus}
                                style={{ color: 'white', borderColor: 'white' }}
                            >
                                Refresh
                            </Button>
                        </Box>
                    }
                />
            </Card>

            <Grid container spacing={2}>
                <Grid item xs={12} lg={4}>
                    {renderBalanceSystem()}
                </Grid>
                <Grid item xs={12} lg={4}>
                    {renderStadiumSystem()}
                </Grid>
                <Grid item xs={12} lg={4}>
                    {renderMatchSystem()}
                </Grid>
            </Grid>
        </div>
    );
}