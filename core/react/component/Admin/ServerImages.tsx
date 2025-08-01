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
import { Divider, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction } from '@material-ui/core';
import client from '../../lib/client';
import Alert, { AlertColor } from '../common/Alert';
import DeleteIcon from '@material-ui/icons/Delete';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import GetAppIcon from '@material-ui/icons/GetApp';
import PublishIcon from '@material-ui/icons/Publish';


interface ServerImage {
    id: string;
    name: string;
    description: string;
    ruid: string;
    version: string;
    createdAt: Date;
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
                        </Grid>

                        <Divider />

                        <List>
                            {images.map((image) => (
                                <ListItem key={image.id}>
                                    <ListItemText
                                        primary={image.name}
                                        secondary={`${image.description} | RUID: ${image.ruid} | Version: ${image.version} | Created: ${image.createdAt.toLocaleDateString()}`}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton onClick={() => handleDeploy(image)} color="primary">
                                            <PlayArrowIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleExport(image)}>
                                            <GetAppIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(image.id)} color="secondary">
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
                                Total images: {images.length}
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