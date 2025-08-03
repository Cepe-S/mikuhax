import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Grid,
    FormControlLabel,
    Switch,
    IconButton,
    Box,
    Dialog,
    DialogContent,
    Divider
} from '@material-ui/core';
import {
    ExpandMore as ExpandMoreIcon,
    Add as AddIcon,
    Delete as DeleteIcon
} from '@material-ui/icons';
import { Alert } from '@material-ui/lab';
import { useHistory } from 'react-router-dom';
import { BrowserHostRoomCommands, BrowserHostRoomConfig, BrowserHostRoomGameRule, BrowserHostRoomHEloConfig, BrowserHostRoomSettings, ReactHostRoomInfo } from '../../../lib/browser.hostconfig';
import * as DefaultConfigSet from "../../lib/defaultroomconfig.json";

interface ServerImageFormProps {
    styleClass: any;
    mode: 'create' | 'edit';
    initialData?: any;
    open?: boolean;
    onClose?: () => void;
    onSave?: (data: any) => void;
}

type AlertSeverity = 'error' | 'warning' | 'info' | 'success';

export default function ServerImageForm({ 
    styleClass, 
    mode, 
    initialData, 
    open = true, 
    onClose, 
    onSave 
}: ServerImageFormProps) {
    const classes = styleClass;
    const fixedHeightPaper = clsx(classes.paper, classes.fullHeight);
    const history = useHistory();
    const [flashMessage, setFlashMessage] = useState('');
    const [alertStatus, setAlertStatus] = useState("success" as AlertSeverity);

    // Image metadata
    const [imageName, setImageName] = useState('');
    const [imageDescription, setImageDescription] = useState('');
    const [imageRuid, setImageRuid] = useState('');
    
    // Discord webhook states
    const [discordWebhook, setDiscordWebhook] = useState({
        replayUrl: '',
        adminCallUrl: '',
        serverStatusUrl: '',
        dailyStatsUrl: '',
        dailyStatsTime: '20:00'
    });

    // Superadmin states
    const [superadmins, setSuperadmins] = useState<{key: string, description: string}[]>([]);

    // Room config states
    const [configFormField, setConfigFormField] = useState({} as BrowserHostRoomConfig);
    const [roomUIDFormField, setRoomUIDFormField] = useState('');
    const [roomPublicFormField, setRoomPublicFormField] = useState(true);
    const [rulesFormField, setRulesFormField] = useState({} as BrowserHostRoomGameRule);
    const [rulesTeamLockField, setRulesTeamLockField] = useState(true);
    const [rulesSwitchesFormField, setRulesSwitchesFormField] = useState({
        autoAdmin: false,
        autoOperating: true,
        statsRecord: true
    });
    const [settingsFormField, setSettingsFormField] = useState({} as BrowserHostRoomSettings);
    const [heloFormField, setHeloFormField] = useState({} as BrowserHostRoomHEloConfig);
    const [commandsFormField, setCommandsFormField] = useState({} as BrowserHostRoomCommands);

    // Add superadmin functions
    const addSuperadmin = () => {
        setSuperadmins([...superadmins, { key: '', description: '' }]);
    };

    const removeSuperadmin = (index: number) => {
        setSuperadmins(superadmins.filter((_, i) => i !== index));
    };

    const updateSuperadmin = (index: number, field: 'key' | 'description', value: string) => {
        const updated = [...superadmins];
        updated[index][field] = value;
        setSuperadmins(updated);
    };

    // Load initial data or defaults
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            // Pre-fill with existing data for edit mode
            setImageName(initialData.name || '');
            setImageDescription(initialData.description || '');
            setImageRuid(initialData.roomName || '');
            
            // Parse the image data if it exists
            if (initialData.imageData) {
                try {
                    const parsedData = typeof initialData.imageData === 'string' 
                        ? JSON.parse(initialData.imageData) 
                        : initialData.imageData;
                    
                    // Load discord webhook data
                    if (parsedData.discordWebhook) {
                        setDiscordWebhook(parsedData.discordWebhook);
                    }
                    
                    // Load superadmins data
                    if (parsedData.superadmins) {
                        setSuperadmins(parsedData.superadmins);
                    }
                    
                    // Load room configuration data
                    if (parsedData.roomConfig) {
                        setConfigFormField(parsedData.roomConfig._config || {});
                        setRoomUIDFormField(parsedData.roomConfig.ruid || '');
                        setRoomPublicFormField(parsedData.roomConfig._config?.public || true);
                        setRulesFormField(parsedData.roomConfig.rules || {});
                        setRulesTeamLockField(parsedData.roomConfig.rules?.requisite?.teamLock || true);
                        setRulesSwitchesFormField({
                            autoAdmin: parsedData.roomConfig.rules?.autoAdmin || false,
                            autoOperating: parsedData.roomConfig.rules?.autoOperating || true,
                            statsRecord: parsedData.roomConfig.rules?.statsRecord || true
                        });
                        setSettingsFormField(parsedData.roomConfig.settings || {});
                        setHeloFormField(parsedData.roomConfig.helo || {});
                        setCommandsFormField(parsedData.roomConfig.commands || {});
                    }
                } catch (error) {
                    console.error('Error parsing image data:', error);
                }
            }
        } else {
            // Load defaults for create mode
            const loadedDefaultSettings: ReactHostRoomInfo = DefaultConfigSet;
            setRoomUIDFormField(loadedDefaultSettings.ruid);
            setConfigFormField(loadedDefaultSettings._config);
            setRoomPublicFormField(loadedDefaultSettings._config.public);
            setRulesFormField(loadedDefaultSettings.rules);
            setRulesTeamLockField(loadedDefaultSettings.rules.requisite.teamLock);
            setRulesSwitchesFormField({
                autoAdmin: loadedDefaultSettings.rules.autoAdmin,
                autoOperating: loadedDefaultSettings.rules.autoOperating,
                statsRecord: loadedDefaultSettings.rules.statsRecord
            });
            setSettingsFormField(loadedDefaultSettings.settings);
            setHeloFormField(loadedDefaultSettings.helo);
            setCommandsFormField(loadedDefaultSettings.commands);
        }
    }, [mode, initialData]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!imageName || !imageDescription || !imageRuid) {
            setFlashMessage('Please fill in all required fields');
            setAlertStatus("error");
            return;
        }

        const imageData = {
            name: imageName,
            description: imageDescription,
            roomName: imageRuid,
            imageData: JSON.stringify({
                discordWebhook,
                superadmins: superadmins.filter(admin => admin.key && admin.description),
                roomConfig: {
                    ruid: roomUIDFormField,
                    _config: {
                        ...configFormField,
                        public: roomPublicFormField
                    },
                    rules: {
                        ...rulesFormField,
                        requisite: {
                            ...rulesFormField.requisite,
                            teamLock: rulesTeamLockField
                        },
                        autoAdmin: rulesSwitchesFormField.autoAdmin,
                        autoOperating: rulesSwitchesFormField.autoOperating,
                        statsRecord: rulesSwitchesFormField.statsRecord
                    },
                    settings: settingsFormField,
                    helo: heloFormField,
                    commands: commandsFormField
                }
            })
        };

        if (onSave) {
            onSave(imageData);
        }
    };

    const handleCancel = () => {
        if (onClose) {
            onClose();
        } else if (mode === 'create') {
            history.push('/admin/server-images');
        }
    };

    const content = (
        <Container maxWidth="lg">
            <Paper className={fixedHeightPaper} style={{ padding: '20px' }}>
                <Typography variant="h4" gutterBottom>
                    {mode === 'create' ? 'Create New Server Image' : 'Edit Server Image'}
                </Typography>

                {flashMessage && (
                    <Alert severity={alertStatus} style={{ marginBottom: '20px' }}>
                        {flashMessage}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Basic Information */}
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Basic Information</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Image Name *"
                                        value={imageName}
                                        onChange={(e) => setImageName(e.target.value)}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Room Name *"
                                        value={imageRuid}
                                        onChange={(e) => setImageRuid(e.target.value)}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Description *"
                                        value={imageDescription}
                                        onChange={(e) => setImageDescription(e.target.value)}
                                        multiline
                                        rows={3}
                                        required
                                    />
                                </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>

                    {/* Discord Webhooks */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Discord Webhooks</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Replay URL"
                                        value={discordWebhook.replayUrl}
                                        onChange={(e) => setDiscordWebhook({...discordWebhook, replayUrl: e.target.value})}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Admin Call URL"
                                        value={discordWebhook.adminCallUrl}
                                        onChange={(e) => setDiscordWebhook({...discordWebhook, adminCallUrl: e.target.value})}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Server Status URL"
                                        value={discordWebhook.serverStatusUrl}
                                        onChange={(e) => setDiscordWebhook({...discordWebhook, serverStatusUrl: e.target.value})}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Daily Stats URL"
                                        value={discordWebhook.dailyStatsUrl}
                                        onChange={(e) => setDiscordWebhook({...discordWebhook, dailyStatsUrl: e.target.value})}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Daily Stats Time"
                                        type="time"
                                        value={discordWebhook.dailyStatsTime}
                                        onChange={(e) => setDiscordWebhook({...discordWebhook, dailyStatsTime: e.target.value})}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>

                    {/* Superadmins */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Superadmins</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box>
                                {superadmins.map((admin, index) => (
                                    <Grid container spacing={2} key={index} style={{ marginBottom: '10px' }}>
                                        <Grid item xs={12} md={5}>
                                            <TextField
                                                fullWidth
                                                label="Auth Key"
                                                value={admin.key}
                                                onChange={(e) => updateSuperadmin(index, 'key', e.target.value)}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={5}>
                                            <TextField
                                                fullWidth
                                                label="Description"
                                                value={admin.description}
                                                onChange={(e) => updateSuperadmin(index, 'description', e.target.value)}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <IconButton onClick={() => removeSuperadmin(index)} color="secondary">
                                                <DeleteIcon />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                ))}
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={addSuperadmin}
                                    style={{ marginTop: '10px' }}
                                >
                                    Add Superadmin
                                </Button>
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    {/* Room Configuration */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Room Configuration</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Room UID"
                                        value={roomUIDFormField}
                                        onChange={(e) => setRoomUIDFormField(e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={roomPublicFormField}
                                                onChange={(e) => setRoomPublicFormField(e.target.checked)}
                                            />
                                        }
                                        label="Public Room"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={rulesTeamLockField}
                                                onChange={(e) => setRulesTeamLockField(e.target.checked)}
                                            />
                                        }
                                        label="Team Lock"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={rulesSwitchesFormField.autoAdmin}
                                                onChange={(e) => setRulesSwitchesFormField({
                                                    ...rulesSwitchesFormField,
                                                    autoAdmin: e.target.checked
                                                })}
                                            />
                                        }
                                        label="Auto Admin"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={rulesSwitchesFormField.autoOperating}
                                                onChange={(e) => setRulesSwitchesFormField({
                                                    ...rulesSwitchesFormField,
                                                    autoOperating: e.target.checked
                                                })}
                                            />
                                        }
                                        label="Auto Operating"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={rulesSwitchesFormField.statsRecord}
                                                onChange={(e) => setRulesSwitchesFormField({
                                                    ...rulesSwitchesFormField,
                                                    statsRecord: e.target.checked
                                                })}
                                            />
                                        }
                                        label="Stats Record"
                                    />
                                </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>

                    {/* Action Buttons */}
                    <Box style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                        >
                            {mode === 'create' ? 'Create Image' : 'Save Changes'}
                        </Button>
                        <Button
                            variant="outlined"
                            color="secondary"
                            size="large"
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Container>
    );

    // If it's edit mode and we have onClose, wrap in Dialog
    if (mode === 'edit' && onClose) {
        return (
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="lg"
                fullWidth
                scroll="paper"
            >
                <DialogContent style={{ padding: 0 }}>
                    {content}
                </DialogContent>
            </Dialog>
        );
    }

    // Otherwise return content directly (for create mode)
    return content;
}
