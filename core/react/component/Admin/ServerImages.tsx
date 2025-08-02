import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Copyright from '../common/Footer.Copyright';
import Title from './common/Widget.Title';
import { ReactHostRoomInfo } from '../../../lib/browser.hostconfig';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { useHistory } from 'react-router-dom';
import { Divider, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction, Chip, Link } from '@material-ui/core';
import client from '../../lib/client';
import Alert, { AlertColor } from '../common/Alert';
import DeleteIcon from '@material-ui/icons/Delete';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import GetAppIcon from '@material-ui/icons/GetApp';
import PublishIcon from '@material-ui/icons/Publish';
import StopIcon from '@material-ui/icons/Stop';
import LinkIcon from '@material-ui/icons/Link';
import PeopleIcon from '@material-ui/icons/People';
import SecurityIcon from '@material-ui/icons/Security';
import RefreshIcon from '@material-ui/icons/Refresh';


interface ServerImage {
    id: string;
    name: string;
    description: string;
    ruid: string;
    version: string;
    createdAt: Date;
    isRunning: boolean;
    roomInfo?: {
        link: string;
        onlinePlayers: number;
        admins: number;
    };
}

interface styleClass {
    styleClass: any;
}

export default function ServerImages({ styleClass }: styleClass) {
    const classes = styleClass;
    const fixedHeightPaper = clsx(classes.paper, classes.fullHeight);
    const history = useHistory();
    const [flashMessage, setFlashMessage] = useState('');
    const [alertStatus, setAlertStatus] = useState("success" as AlertColor);
    const [images, setImages] = useState<ServerImage[]>([]);

    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async () => {
        try {
            const result = await client.get('/api/v1/images');
            if (result.status === 200) {
                setImages(result.data.map((img: any) => ({
                    ...img,
                    createdAt: new Date(img.createdAt)
                })));
            }
        } catch (error) {
            setFlashMessage('Failed to load server images');
            setAlertStatus("error");
            setTimeout(() => setFlashMessage(''), 3000);
        }
    };

    const handleDeploy = async (image: ServerImage) => {
        const token = prompt('Enter Haxball token:');
        
        if (!token) {
            setFlashMessage('Token is required');
            setAlertStatus("error");
            setTimeout(() => setFlashMessage(''), 3000);
            return;
        }

        try {
            setFlashMessage('Deploying server...');
            setAlertStatus("info");
            const result = await client.post('/api/v1/images/deploy', {
                imageId: image.id,
                token
            });
            if (result.status === 201) {
                setFlashMessage('Server deployed successfully');
                setAlertStatus("success");
                history.push('/admin/roomlist');
            }
        } catch (error) {
            setFlashMessage('Failed to deploy server');
            setAlertStatus("error");
            setTimeout(() => setFlashMessage(''), 3000);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const result = await client.delete(`/api/v1/images/${id}`);
            if (result.status === 204) {
                setImages(images.filter(img => img.id !== id));
                setFlashMessage('Image deleted');
                setAlertStatus("success");
                setTimeout(() => setFlashMessage(''), 2000);
            }
        } catch (error) {
            setFlashMessage('Failed to delete image');
            setAlertStatus("error");
            setTimeout(() => setFlashMessage(''), 3000);
        }
    };

    const handleExport = async (image: ServerImage) => {
        try {
            const result = await client.get(`/api/v1/images/${image.id}`);
            if (result.status === 200) {
                const dataStr = JSON.stringify(result.data, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${image.name}.json`;
                link.click();
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            setFlashMessage('Failed to export image');
            setAlertStatus("error");
            setTimeout(() => setFlashMessage(''), 3000);
        }
    };

    const handleStop = async (image: ServerImage) => {
        try {
            setFlashMessage('Stopping server...');
            setAlertStatus("info");
            const result = await client.delete(`/api/v1/room/${image.ruid}`);
            if (result.status === 204) {
                setFlashMessage('Server stopped successfully');
                setAlertStatus("success");
                setTimeout(() => setFlashMessage(''), 2000);
                loadImages(); // Reload the list
            }
        } catch (error) {
            setFlashMessage('Failed to stop server');
            setAlertStatus("error");
            setTimeout(() => setFlashMessage(''), 3000);
        }
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importedImage = JSON.parse(e.target?.result as string);
                    const result = await client.post('/api/v1/images', importedImage);
                    if (result.status === 201) {
                        loadImages(); // Reload the list
                        setFlashMessage('Image imported successfully');
                        setAlertStatus("success");
                        setTimeout(() => setFlashMessage(''), 2000);
                    }
                } catch (error) {
                    setFlashMessage('Failed to import image');
                    setAlertStatus("error");
                    setTimeout(() => setFlashMessage(''), 3000);
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <Container maxWidth="lg" className={classes.container}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper className={fixedHeightPaper}>
                        {flashMessage && <Alert severity={alertStatus}>{flashMessage}</Alert>}
                        <Title>Server Images</Title>
                        
                        <Grid container spacing={2} style={{ marginBottom: 16 }}>
                            <Grid item xs={6} sm={3}>
                                <Button 
                                    fullWidth 
                                    variant="contained" 
                                    color="primary" 
                                    onClick={() => history.push('/admin/newimage')}
                                >
                                    Create New Image
                                </Button>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <input
                                    accept=".json"
                                    style={{ display: 'none' }}
                                    id="import-file"
                                    type="file"
                                    onChange={handleImport}
                                />
                                <label htmlFor="import-file">
                                    <Button 
                                        fullWidth 
                                        variant="outlined" 
                                        component="span"
                                        startIcon={<PublishIcon />}
                                    >
                                        Import Image
                                    </Button>
                                </label>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Button 
                                    fullWidth 
                                    variant="outlined" 
                                    onClick={loadImages}
                                    startIcon={<RefreshIcon />}
                                >
                                    Refresh Status
                                </Button>
                            </Grid>
                        </Grid>

                        <Divider />

                        <List>
                            {images.map((image) => (
                                <ListItem key={image.id} style={{ 
                                    backgroundColor: image.isRunning ? '#e8f5e8' : 'transparent',
                                    border: image.isRunning ? '1px solid #4caf50' : 'none',
                                    borderRadius: '4px',
                                    marginBottom: '8px'
                                }}>
                                    <ListItemText
                                        primary={
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>{image.name}</span>
                                                <Chip 
                                                    label={image.isRunning ? 'RUNNING' : 'STOPPED'} 
                                                    color={image.isRunning ? 'primary' : 'default'}
                                                    size="small"
                                                    variant={image.isRunning ? 'default' : 'outlined'}
                                                />
                                            </div>
                                        }
                                        secondary={
                                            <div>
                                                <div>{`${image.description} | RUID: ${image.ruid} | Version: ${image.version} | Created: ${image.createdAt.toLocaleDateString()}`}</div>
                                                {image.isRunning && image.roomInfo && (
                                                    <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <LinkIcon fontSize="small" />
                                                            <Link 
                                                                href={image.roomInfo.link} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                style={{ fontSize: '0.875rem' }}
                                                            >
                                                                Join Room
                                                            </Link>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <PeopleIcon fontSize="small" />
                                                            <span style={{ fontSize: '0.875rem' }}>{image.roomInfo.onlinePlayers} players</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <SecurityIcon fontSize="small" />
                                                            <span style={{ fontSize: '0.875rem' }}>{image.roomInfo.admins} admins</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        {image.isRunning ? (
                                            <IconButton onClick={() => handleStop(image)} color="secondary" title="Stop Server">
                                                <StopIcon />
                                            </IconButton>
                                        ) : (
                                            <IconButton onClick={() => handleDeploy(image)} color="primary" title="Deploy Server">
                                                <PlayArrowIcon />
                                            </IconButton>
                                        )}
                                        <IconButton onClick={() => handleExport(image)} title="Export Image">
                                            <GetAppIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(image.id)} color="secondary" title="Delete Image">
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>

                        {images.length === 0 && (
                            <Typography variant="body2" color="textSecondary" style={{ textAlign: 'center', marginTop: 32 }}>
                                No server images found. Create one to get started.
                            </Typography>
                        )}

                        {images.length > 0 && (
                            <Typography variant="caption" color="textSecondary" style={{ marginTop: 16, display: 'block' }}>
                                Total images: {images.length} | Running: {images.filter(img => img.isRunning).length} | Stopped: {images.filter(img => !img.isRunning).length}
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>
            <Box pt={4}>
                <Copyright />
            </Box>
        </Container>
    );
}