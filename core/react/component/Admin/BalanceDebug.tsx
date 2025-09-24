import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@material-ui/core';
import { Button, Badge, Typography, Box, Divider } from '@material-ui/core';
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

const useStyles = makeStyles((theme) => ({
    root: {
        padding: theme.spacing(3),
    },
    card: {
        marginBottom: theme.spacing(2),
    },
    statBox: {
        textAlign: 'center',
        padding: theme.spacing(2),
        border: '1px solid #e0e0e0',
        borderRadius: theme.spacing(1),
    },
    actionItem: {
        padding: theme.spacing(1),
        marginBottom: theme.spacing(1),
        borderLeft: '4px solid #ccc',
        paddingLeft: theme.spacing(2),
    },
    queueItem: {
        padding: theme.spacing(1),
        backgroundColor: '#f5f5f5',
        borderRadius: theme.spacing(0.5),
        marginBottom: theme.spacing(1),
    },
}));

export function BalanceDebug() {
    const classes = useStyles();
    const { ruid } = useParams<{ ruid: string }>();
    const [status, setStatus] = useState<BalanceStatus | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = async () => {
        try {
            const response = await fetch(`/api/v1/room/${ruid}/balance/status`);
            if (response.ok) {
                const data = await response.json();
                setStatus(data);
                setError(null);
            } else if (response.status === 404) {
                setError('Balance system not available');
                setAutoRefresh(false); // Stop polling on 404
            }
        } catch (error) {
            setError('Failed to fetch balance status');
            console.error('Failed to fetch balance status:', error);
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
                <Card className={classes.card}>
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

    if (!status) {
        return <div>Loading balance debug...</div>;
    }

    return (
        <div className={classes.root}>
            <Card className={classes.card}>
                <CardHeader
                    title="Balance System Debug"
                    action={
                        <Box>
                            <Button
                                variant={autoRefresh ? "contained" : "outlined"}
                                size="small"
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                style={{ marginRight: 8 }}
                            >
                                {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
                            </Button>
                            <Button variant="outlined" size="small" onClick={fetchStatus}>
                                Refresh
                            </Button>
                        </Box>
                    }
                />
                <CardContent>
                    <Box display="flex" justifyContent="space-around" mb={3}>
                        <div className={classes.statBox}>
                            <Typography variant="h4" style={{ color: '#f44336' }}>{status.redCount}</Typography>
                            <Typography variant="body2" color="textSecondary">Red Team</Typography>
                        </div>
                        <div className={classes.statBox}>
                            <Typography variant="h4" style={{ color: '#2196f3' }}>{status.blueCount}</Typography>
                            <Typography variant="body2" color="textSecondary">Blue Team</Typography>
                        </div>
                        <div className={classes.statBox}>
                            <Typography variant="h4" style={{ color: '#ff9800' }}>{status.queueLength}</Typography>
                            <Typography variant="body2" color="textSecondary">Queue</Typography>
                        </div>
                        <div className={classes.statBox}>
                            <Badge color={status.config.enabled ? "primary" : "default"}>
                                {status.config.enabled ? 'ENABLED' : 'DISABLED'}
                            </Badge>
                            <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
                                Mode: {status.config.mode.toUpperCase()} | Max: {status.config.maxPlayersPerTeam}
                            </Typography>
                        </div>
                    </Box>
                </CardContent>
            </Card>

            {status.queue.length > 0 && (
                <Card className={classes.card}>
                    <CardHeader title={`Queue (${status.queue.length} players)`} />
                    <CardContent>
                        {status.queue.map((entry, index) => (
                            <div key={entry.playerId} className={classes.queueItem}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <div>
                                        <Typography variant="body1">#{index + 1} {entry.playerName}</Typography>
                                        <Typography variant="body2" color="textSecondary">Rating: {Math.round(entry.rating)}</Typography>
                                    </div>
                                    <Typography variant="body2" color="textSecondary">
                                        Waiting: {Math.round((Date.now() - entry.joinTime) / 1000)}s
                                    </Typography>
                                </Box>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <Card className={classes.card}>
                <CardHeader title={`Recent Actions (${status.recentActions.length})`} />
                <CardContent>
                    <Box maxHeight={400} overflow="auto">
                        {status.recentActions.map((action, index) => (
                            <div key={index} className={classes.actionItem} style={{ borderLeftColor: getActionColor(action.action) }}>
                                <Box display="flex" alignItems="center" style={{ gap: 16 }}>
                                    <Badge 
                                        style={{ 
                                            backgroundColor: getActionColor(action.action), 
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px'
                                        }}
                                    >
                                        {action.action}
                                    </Badge>
                                    <Box flex={1}>
                                        <Typography variant="body2">
                                            <strong>{action.playerName}</strong>
                                            <span style={{ margin: '0 8px' }}>
                                                {getTeamName(action.fromTeam)} → {getTeamName(action.toTeam)}
                                            </span>
                                            <span style={{ color: '#666' }}>{action.reason}</span>
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {formatTime(action.timestamp)} | 
                                            Mode: {action.mode.toUpperCase()} | 
                                            R:{action.redCount} B:{action.blueCount}
                                            {action.queueLength !== undefined && ` Q:${action.queueLength}`}
                                        </Typography>
                                    </Box>
                                </Box>
                            </div>
                        ))}
                    </Box>
                </CardContent>
            </Card>
        </div>
    );
}