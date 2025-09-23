import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Copyright from '../common/Footer.Copyright';
import Title from './common/Widget.Title';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { useHistory, useParams } from 'react-router-dom';
import { Divider, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core';
import client from '../../lib/client';
import Alert, { AlertColor } from '../common/Alert';
import DeleteIcon from '@material-ui/icons/Delete';
import RefreshIcon from '@material-ui/icons/Refresh';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import BlockIcon from '@material-ui/icons/Block';
import VolumeOffIcon from '@material-ui/icons/VolumeOff';

interface Sanction {
    id: number;
    ruid: string;
    type: 'ban' | 'mute';
    auth: string;
    conn: string;
    reason?: string;
    register: number;
    expire: number;
    adminAuth?: string;
    adminName?: string;
    playerName?: string;
    active: boolean;
}

interface styleClass {
    styleClass: any;
}

export default function ServerSanctions({ styleClass }: styleClass) {
    const classes = styleClass;
    const fixedHeightPaper = clsx(classes.paper, classes.fullHeight);
    const history = useHistory();
    const { ruid } = useParams<{ ruid: string }>();
    const [flashMessage, setFlashMessage] = useState('');
    const [alertStatus, setAlertStatus] = useState("success" as AlertColor);
    const [sanctions, setSanctions] = useState<Sanction[]>([]);
    const [selectedSanction, setSelectedSanction] = useState<Sanction | null>(null);
    const [confirmDialog, setConfirmDialog] = useState(false);

    useEffect(() => {
        loadSanctions();
    }, [ruid]);

    const loadSanctions = async () => {
        try {
            const [bansResult, mutesResult] = await Promise.all([
                client.get(`/api/v1/sanctions/${ruid}/bans`),
                client.get(`/api/v1/sanctions/${ruid}/mutes`)
            ]);
            
            const allSanctions = [
                ...bansResult.data.map((ban: any) => ({ ...ban, type: 'ban' })),
                ...mutesResult.data.map((mute: any) => ({ ...mute, type: 'mute' }))
            ];
            
            setSanctions(allSanctions);
        } catch (error) {
            setFlashMessage('Failed to load sanctions');
            setAlertStatus("error");
            setTimeout(() => setFlashMessage(''), 3000);
        }
    };

    const handleRemoveSanction = async (sanction: Sanction) => {
        try {
            const endpoint = sanction.type === 'ban' ? 'bans' : 'mutes';
            const result = await client.delete(`/api/v1/sanctions/${ruid}/${endpoint}/${sanction.auth}`);
            if (result.status === 204) {
                setFlashMessage(`${sanction.type === 'ban' ? 'Unbanned' : 'Unmuted'} player successfully`);
                setAlertStatus("success");
                setTimeout(() => setFlashMessage(''), 2000);
                loadSanctions();
            }
        } catch (error) {
            setFlashMessage(`Failed to remove ${sanction.type}`);
            setAlertStatus("error");
            setTimeout(() => setFlashMessage(''), 3000);
        }
        setConfirmDialog(false);
        setSelectedSanction(null);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const isExpired = (expire: number) => {
        return expire > 0 && Date.now() > expire;
    };

    const getTimeRemaining = (expire: number) => {
        if (expire === 0) return 'Permanent';
        if (isExpired(expire)) return 'Expired';
        
        const remaining = expire - Date.now();
        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const activeSanctions = sanctions.filter(s => s.active && !isExpired(s.expire));
    const expiredSanctions = sanctions.filter(s => s.active && isExpired(s.expire));
    const removedSanctions = sanctions.filter(s => !s.active);

    return (
        <Container maxWidth="lg" className={classes.container}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper className={fixedHeightPaper}>
                        {flashMessage && <Alert severity={alertStatus}>{flashMessage}</Alert>}
                        
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                            <IconButton onClick={() => history.push('/admin/serverimages')} style={{ marginRight: 8 }}>
                                <ArrowBackIcon />
                            </IconButton>
                            <Title>Server Sanctions - RUID: {ruid}</Title>
                        </div>
                        
                        <Grid container spacing={2} style={{ marginBottom: 16 }}>
                            <Grid item xs={6} sm={3}>
                                <Button 
                                    fullWidth 
                                    variant="outlined" 
                                    onClick={loadSanctions}
                                    startIcon={<RefreshIcon />}
                                >
                                    Refresh
                                </Button>
                            </Grid>
                        </Grid>

                        <Divider />

                        {/* Active Sanctions */}
                        <Typography variant="h6" style={{ marginTop: 16, marginBottom: 8, color: '#d32f2f' }}>
                            Active Sanctions ({activeSanctions.length})
                        </Typography>
                        <List>
                            {activeSanctions.map((sanction) => (
                                <ListItem key={sanction.id} style={{ 
                                    backgroundColor: sanction.type === 'ban' ? '#ffebee' : '#fff3e0',
                                    border: `1px solid ${sanction.type === 'ban' ? '#f44336' : '#ff9800'}`,
                                    borderRadius: '4px',
                                    marginBottom: '8px'
                                }}>
                                    <ListItemText
                                        primary={
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {sanction.type === 'ban' ? <BlockIcon color="error" /> : <VolumeOffIcon color="primary" />}
                                                <span>{sanction.playerName || 'Unknown Player'}</span>
                                                <Chip 
                                                    label={sanction.type.toUpperCase()} 
                                                    color={sanction.type === 'ban' ? 'secondary' : 'primary'}
                                                    size="small"
                                                />
                                                <Chip 
                                                    label={getTimeRemaining(sanction.expire)} 
                                                    variant="outlined"
                                                    size="small"
                                                />
                                            </div>
                                        }
                                        secondary={
                                            <div>
                                                <div><strong>Reason:</strong> {sanction.reason || 'No reason provided'}</div>
                                                <div><strong>Auth:</strong> {sanction.auth}</div>
                                                <div><strong>Admin:</strong> {sanction.adminName || 'Unknown'}</div>
                                                <div><strong>Created:</strong> {formatDate(sanction.register)}</div>
                                                {sanction.expire > 0 && <div><strong>Expires:</strong> {formatDate(sanction.expire)}</div>}
                                            </div>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton 
                                            onClick={() => {
                                                setSelectedSanction(sanction);
                                                setConfirmDialog(true);
                                            }} 
                                            color="secondary" 
                                            title={`Remove ${sanction.type}`}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>

                        {activeSanctions.length === 0 && (
                            <Typography variant="body2" color="textSecondary" style={{ textAlign: 'center', marginTop: 16 }}>
                                No active sanctions found.
                            </Typography>
                        )}

                        {/* Expired Sanctions */}
                        {expiredSanctions.length > 0 && (
                            <>
                                <Typography variant="h6" style={{ marginTop: 24, marginBottom: 8, color: '#757575' }}>
                                    Expired Sanctions ({expiredSanctions.length})
                                </Typography>
                                <List>
                                    {expiredSanctions.map((sanction) => (
                                        <ListItem key={sanction.id} style={{ 
                                            backgroundColor: '#f5f5f5',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: '4px',
                                            marginBottom: '8px',
                                            opacity: 0.7
                                        }}>
                                            <ListItemText
                                                primary={
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {sanction.type === 'ban' ? <BlockIcon /> : <VolumeOffIcon />}
                                                        <span>{sanction.playerName || 'Unknown Player'}</span>
                                                        <Chip label={sanction.type.toUpperCase()} size="small" variant="outlined" />
                                                        <Chip label="EXPIRED" color="default" size="small" />
                                                    </div>
                                                }
                                                secondary={
                                                    <div>
                                                        <div><strong>Reason:</strong> {sanction.reason || 'No reason provided'}</div>
                                                        <div><strong>Expired:</strong> {formatDate(sanction.expire)}</div>
                                                    </div>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </>
                        )}

                        {/* Removed Sanctions */}
                        {removedSanctions.length > 0 && (
                            <>
                                <Typography variant="h6" style={{ marginTop: 24, marginBottom: 8, color: '#4caf50' }}>
                                    Removed Sanctions ({removedSanctions.length})
                                </Typography>
                                <List>
                                    {removedSanctions.slice(0, 10).map((sanction) => (
                                        <ListItem key={sanction.id} style={{ 
                                            backgroundColor: '#e8f5e8',
                                            border: '1px solid #4caf50',
                                            borderRadius: '4px',
                                            marginBottom: '8px',
                                            opacity: 0.8
                                        }}>
                                            <ListItemText
                                                primary={
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {sanction.type === 'ban' ? <BlockIcon /> : <VolumeOffIcon />}
                                                        <span>{sanction.playerName || 'Unknown Player'}</span>
                                                        <Chip label={sanction.type.toUpperCase()} size="small" variant="outlined" />
                                                        <Chip label="REMOVED" color="primary" size="small" />
                                                    </div>
                                                }
                                                secondary={
                                                    <div>
                                                        <div><strong>Reason:</strong> {sanction.reason || 'No reason provided'}</div>
                                                        <div><strong>Created:</strong> {formatDate(sanction.register)}</div>
                                                    </div>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                                {removedSanctions.length > 10 && (
                                    <Typography variant="caption" color="textSecondary">
                                        Showing last 10 removed sanctions
                                    </Typography>
                                )}
                            </>
                        )}

                        <Typography variant="caption" color="textSecondary" style={{ marginTop: 16, display: 'block' }}>
                            Total sanctions: {sanctions.length} | Active: {activeSanctions.length} | Expired: {expiredSanctions.length} | Removed: {removedSanctions.length}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
                <DialogTitle>
                    Confirm {selectedSanction?.type === 'ban' ? 'Unban' : 'Unmute'}
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to {selectedSanction?.type === 'ban' ? 'unban' : 'unmute'} player "{selectedSanction?.playerName || 'Unknown Player'}"?
                    </Typography>
                    {selectedSanction && (
                        <div style={{ marginTop: 16 }}>
                            <Typography variant="body2"><strong>Reason:</strong> {selectedSanction.reason || 'No reason provided'}</Typography>
                            <Typography variant="body2"><strong>Auth:</strong> {selectedSanction.auth}</Typography>
                            <Typography variant="body2"><strong>Created:</strong> {formatDate(selectedSanction.register)}</Typography>
                        </div>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog(false)} color="primary">
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => selectedSanction && handleRemoveSanction(selectedSanction)} 
                        color="secondary"
                        variant="contained"
                    >
                        {selectedSanction?.type === 'ban' ? 'Unban' : 'Unmute'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Box pt={4}>
                <Copyright />
            </Box>
        </Container>
    );
}