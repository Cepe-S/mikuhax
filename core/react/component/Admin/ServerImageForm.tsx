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
                        const settings = parsedData.roomConfig.settings || {};
                        // Load balance configuration
                        if (settings.balance) {
                            settings.balanceEnabled = settings.balance.enabled;
                            settings.balanceMode = settings.balance.mode;
                            settings.balanceMaxPlayersPerTeam = settings.balance.maxPlayersPerTeam;
                        }
                        setSettingsFormField(settings);
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
                    settings: {
                        ...settingsFormField,
                        balance: {
                            enabled: settingsFormField.balanceEnabled !== false,
                            mode: settingsFormField.balanceMode || 'jt',
                            maxPlayersPerTeam: settingsFormField.balanceMaxPlayersPerTeam || 4
                        }
                    },
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

                    {/* Anti-AFK System */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">💤 Sistema Anti-AFK</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="textSecondary" style={{ marginBottom: '16px' }}>
                                        Configura el sistema de detección automática de jugadores inactivos (AFK). 
                                        El sistema verifica cada 15 segundos si los jugadores muestran actividad.
                                    </Typography>
                                </Grid>
                                
                                {/* Detección Automática */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                        🔍 Detección Automática
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Límite de Inactividad (conteos)"
                                        value={settingsFormField.afkCountLimit || 20}
                                        onChange={(e) => setSettingsFormField({
                                            ...settingsFormField,
                                            afkCountLimit: parseInt(e.target.value) || 20
                                        })}
                                        helperText="Número de verificaciones (15s c/u) antes del kick automático"
                                        inputProps={{ min: 1, max: 100 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="textSecondary" style={{ padding: '16px 0' }}>
                                        ⏱️ Tiempo total: {Math.round((settingsFormField.afkCountLimit || 20) * 15 / 60)} minutos
                                        <br />
                                        📊 Verificaciones cada 15 segundos
                                        <br />
                                        🎯 Solo afecta jugadores en equipos durante partidas
                                    </Typography>
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider style={{ margin: '16px 0' }} />
                                </Grid>

                                {/* Comando Manual AFK */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                        🎮 Comando Manual (!afk)
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settingsFormField.afkCommandAutoKick || false}
                                                onChange={(e) => setSettingsFormField({
                                                    ...settingsFormField,
                                                    afkCommandAutoKick: e.target.checked
                                                })}
                                            />
                                        }
                                        label="Auto-kick por AFK prolongado"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Tiempo máximo AFK (minutos)"
                                        value={Math.round((settingsFormField.afkCommandAutoKickAllowMillisecs || 300000) / 60000)}
                                        onChange={(e) => setSettingsFormField({
                                            ...settingsFormField,
                                            afkCommandAutoKickAllowMillisecs: (parseInt(e.target.value) || 5) * 60000
                                        })}
                                        disabled={!settingsFormField.afkCommandAutoKick}
                                        helperText="Tiempo máximo que un jugador puede estar AFK manualmente"
                                        inputProps={{ min: 1, max: 60 }}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider style={{ margin: '16px 0' }} />
                                </Grid>

                                {/* Protecciones Anti-Abuso */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                        🛡️ Protecciones Anti-Abuso
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settingsFormField.antiAFKFlood || true}
                                                onChange={(e) => setSettingsFormField({
                                                    ...settingsFormField,
                                                    antiAFKFlood: e.target.checked
                                                })}
                                            />
                                        }
                                        label="Anti-spam del comando !afk"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settingsFormField.antiAFKAbusing || false}
                                                onChange={(e) => setSettingsFormField({
                                                    ...settingsFormField,
                                                    antiAFKAbusing: e.target.checked
                                                })}
                                            />
                                        }
                                        label="Prevenir AFK durante partidas"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="textSecondary">
                                        ℹ️ <strong>Nota importante:</strong> Los superadministradores nunca son kickeados por AFK para prevenir la pérdida accidental de administradores.
                                    </Typography>
                                </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>

                    {/* Anti-Trolling & Security */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">🛡️ Seguridad y Anti-Trolling</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="textSecondary" style={{ marginBottom: '16px' }}>
                                        Configuraciones adicionales para prevenir comportamientos maliciosos y abuso del sistema.
                                    </Typography>
                                </Grid>
                                
                                {/* Anti-Flood Systems */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                        🌊 Sistemas Anti-Flood
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settingsFormField.antiJoinFlood || true}
                                                onChange={(e) => setSettingsFormField({
                                                    ...settingsFormField,
                                                    antiJoinFlood: e.target.checked
                                                })}
                                            />
                                        }
                                        label="Anti-flood de conexiones"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settingsFormField.antiChatFlood || true}
                                                onChange={(e) => setSettingsFormField({
                                                    ...settingsFormField,
                                                    antiChatFlood: e.target.checked
                                                })}
                                            />
                                        }
                                        label="Anti-spam de chat"
                                    />
                                </Grid>
                                
                                {/* Anti-Spam Mute System */}
                                <Grid item xs={12}>
                                    <Divider style={{ margin: '16px 0' }} />
                                    <Typography variant="subtitle1" style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                        🔇 Sistema de Muteo Automático por Spam
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settingsFormField.antiSpamMuteEnabled || true}
                                                onChange={(e) => setSettingsFormField({
                                                    ...settingsFormField,
                                                    antiSpamMuteEnabled: e.target.checked
                                                })}
                                            />
                                        }
                                        label="Muteo automático por spam"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Tiempo de muteo (minutos)"
                                        value={Math.round((settingsFormField.antiSpamMuteTimeMillisecs || 300000) / 60000)}
                                        onChange={(e) => setSettingsFormField({
                                            ...settingsFormField,
                                            antiSpamMuteTimeMillisecs: (parseInt(e.target.value) || 5) * 60000
                                        })}
                                        disabled={!settingsFormField.antiSpamMuteEnabled}
                                        helperText="Duración del muteo automático por spam"
                                        inputProps={{ min: 1, max: 60 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settingsFormField.antiSpamMuteLogEnabled || true}
                                                onChange={(e) => setSettingsFormField({
                                                    ...settingsFormField,
                                                    antiSpamMuteLogEnabled: e.target.checked
                                                })}
                                            />
                                        }
                                        label="Logging de muteos"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settingsFormField.antiPlayerKickAbusing || true}
                                                onChange={(e) => setSettingsFormField({
                                                    ...settingsFormField,
                                                    antiPlayerKickAbusing: e.target.checked
                                                })}
                                            />
                                        }
                                        label="Anti-abuso de kicks"
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider style={{ margin: '16px 0' }} />
                                </Grid>

                                {/* Game Behavior */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                        🎮 Comportamiento en Juego
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settingsFormField.antiGameAbscond || true}
                                                onChange={(e) => setSettingsFormField({
                                                    ...settingsFormField,
                                                    antiGameAbscond: e.target.checked
                                                })}
                                            />
                                        }
                                        label="Penalizar abandono de partidas"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settingsFormField.guaranteePlayingTime || true}
                                                onChange={(e) => setSettingsFormField({
                                                    ...settingsFormField,
                                                    guaranteePlayingTime: e.target.checked
                                                })}
                                            />
                                        }
                                        label="Garantizar tiempo de juego mínimo"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Tiempo mínimo garantizado (segundos)"
                                        value={settingsFormField.guaranteedPlayingTimeSeconds || 20}
                                        onChange={(e) => setSettingsFormField({
                                            ...settingsFormField,
                                            guaranteedPlayingTimeSeconds: parseInt(e.target.value) || 20
                                        })}
                                        disabled={!settingsFormField.guaranteePlayingTime}
                                        helperText="Tiempo mínimo que un jugador debe jugar antes de poder salir"
                                        inputProps={{ min: 5, max: 300 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Penalización por abandono (rating)"
                                        value={settingsFormField.gameAbscondRatingPenalty || 10}
                                        onChange={(e) => setSettingsFormField({
                                            ...settingsFormField,
                                            gameAbscondRatingPenalty: parseInt(e.target.value) || 10
                                        })}
                                        disabled={!settingsFormField.antiGameAbscond}
                                        helperText="Puntos de rating perdidos por abandonar partidas"
                                        inputProps={{ min: 1, max: 100 }}
                                    />
                                </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>

                    {/* Balance System */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">⚖️ Sistema de Balanceo</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="textSecondary" style={{ marginBottom: '16px' }}>
                                        Configura el sistema automático de balanceo de equipos para mantener partidas justas y organizadas.
                                    </Typography>
                                </Grid>
                                
                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settingsFormField.balanceEnabled !== false}
                                                onChange={(e) => setSettingsFormField({
                                                    ...settingsFormField,
                                                    balanceEnabled: e.target.checked
                                                })}
                                            />
                                        }
                                        label="Activar Sistema de Balanceo"
                                    />
                                </Grid>
                                
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        select
                                        label="Modo de Balanceo"
                                        value={settingsFormField.balanceMode || 'jt'}
                                        onChange={(e) => setSettingsFormField({
                                            ...settingsFormField,
                                            balanceMode: e.target.value
                                        })}
                                        disabled={settingsFormField.balanceEnabled === false}
                                        SelectProps={{ native: true }}
                                        helperText="JT: Simple | PRO: Con cola"
                                    >
                                        <option value="jt">JT - Balanceo Simple</option>
                                        <option value="pro">PRO - Con Sistema de Cola</option>
                                    </TextField>
                                </Grid>
                                
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Máximo Jugadores por Equipo"
                                        value={settingsFormField.balanceMaxPlayersPerTeam || 4}
                                        onChange={(e) => setSettingsFormField({
                                            ...settingsFormField,
                                            balanceMaxPlayersPerTeam: parseInt(e.target.value) || 4
                                        })}
                                        disabled={settingsFormField.balanceEnabled === false}
                                        helperText="Límite de jugadores por equipo"
                                        inputProps={{ min: 1, max: 10 }}
                                    />
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <Typography variant="body2" style={{ 
                                        padding: '12px', 
                                        backgroundColor: '#f5f5f5', 
                                        borderRadius: '4px',
                                        marginTop: '8px'
                                    }}>
                                        <strong>Modo JT:</strong> Balanceo simple que mantiene diferencia máxima de 1 jugador entre equipos.<br/>
                                        <strong>Modo PRO:</strong> Sistema avanzado con cola FIFO que garantiza equipos perfectamente balanceados y respeta el orden de llegada.
                                    </Typography>
                                </Grid>
                            </Grid>
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
