import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Copyright from '../common/Footer.Copyright';
import Title from './common/Widget.Title';
import { BrowserHostRoomCommands, BrowserHostRoomConfig, BrowserHostRoomGameRule, BrowserHostRoomHEloConfig, BrowserHostRoomSettings, ReactHostRoomInfo } from '../../../lib/browser.hostconfig';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import * as DefaultConfigSet from "../../lib/defaultroomconfig.json";
import { useHistory } from 'react-router-dom';
import { Divider, Switch, Accordion, AccordionSummary, AccordionDetails } from '@material-ui/core';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Alert, { AlertColor } from '../common/Alert';
import { isNumber } from '../../lib/numcheck';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

interface ServerImage {
    id: string;
    name: string;
    description: string;
    headlessToken: string;
    config: ReactHostRoomInfo;
    createdAt: Date;
}

interface styleClass {
    styleClass: any;
}

const getServerImages = (): ServerImage[] => {
    const saved = localStorage.getItem('_serverImages');
    return saved ? JSON.parse(saved) : [];
};

const saveServerImages = (images: ServerImage[]) => {
    localStorage.setItem('_serverImages', JSON.stringify(images));
};

export default function ServerImageCreate({ styleClass }: styleClass) {
    const classes = styleClass;
    const fixedHeightPaper = clsx(classes.paper, classes.fullHeight);
    const history = useHistory();
    const [flashMessage, setFlashMessage] = useState('');
    const [alertStatus, setAlertStatus] = useState("success" as AlertColor);

    // Image metadata
    const [imageName, setImageName] = useState('');
    const [imageDescription, setImageDescription] = useState('');
    const [imageRuid, setImageRuid] = useState('');
    
    // Discord webhook states
    const [discordWebhook, setDiscordWebhook] = useState({
        replayUrl: '',
        adminCallUrl: ''
    });


    // Room config states (simplified from original RoomCreate)
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

    useEffect(() => {
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
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!imageName || !imageDescription || !imageRuid) {
            setFlashMessage('Please fill in all required fields');
            setAlertStatus("error");
            setTimeout(() => setFlashMessage(''), 3000);
            return;
        }
        
        // Validate Discord webhook URL formats
        if (discordWebhook.replayUrl && !discordWebhook.replayUrl.match(/^https:\/\/discord\.com\/api\/webhooks\/\d+\/[a-zA-Z0-9_-]+$/)) {
            setFlashMessage('Invalid replay webhook URL format. Please use the complete webhook URL from Discord.');
            setAlertStatus("error");
            setTimeout(() => setFlashMessage(''), 3000);
            return;
        }
        if (discordWebhook.adminCallUrl && !discordWebhook.adminCallUrl.match(/^https:\/\/discord\.com\/api\/webhooks\/\d+\/[a-zA-Z0-9_-]+$/)) {
            setFlashMessage('Invalid admin call webhook URL format. Please use the complete webhook URL from Discord.');
            setAlertStatus("error");
            setTimeout(() => setFlashMessage(''), 3000);
            return;
        }

        const serverImageData = {
            name: imageName,
            description: imageDescription,
            ruid: imageRuid,
            version: "1.0.0",
            createdAt: new Date(),
            config: {
                roomName: configFormField.roomName,
                playerName: configFormField.playerName || 'Host',
                password: configFormField.password,
                maxPlayers: configFormField.maxPlayers,
                public: roomPublicFormField,
                noPlayer: configFormField.noPlayer || false,
                geo: configFormField.geo
            },
            settings: settingsFormField,
            rules: {
                ...rulesFormField,
                requisite: { ...rulesFormField.requisite, teamLock: rulesTeamLockField },
                autoAdmin: rulesSwitchesFormField.autoAdmin,
                autoOperating: rulesSwitchesFormField.autoOperating,
                statsRecord: rulesSwitchesFormField.statsRecord
            },
            helo: heloFormField,
            commands: commandsFormField,
            stadiums: {
                default: rulesFormField.defaultMapName,
                ready: rulesFormField.readyMapName
            },
            webhooks: {
                discord: (discordWebhook.replayUrl || discordWebhook.adminCallUrl) ? {
                    replayUrl: discordWebhook.replayUrl || undefined,
                    adminCallUrl: discordWebhook.adminCallUrl || undefined,
                    replayUpload: !!discordWebhook.replayUrl
                } : undefined
            }
        };

        try {
            const response = await fetch('/api/v1/images', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(serverImageData)
            });

            if (response.ok) {
                setFlashMessage('Server image created successfully');
                setAlertStatus("success");
                setTimeout(() => {
                    history.push('/admin/serverimages');
                }, 1500);
            } else {
                const error = await response.json();
                setFlashMessage(error.error || 'Failed to create server image');
                setAlertStatus("error");
                setTimeout(() => setFlashMessage(''), 3000);
            }
        } catch (error) {
            setFlashMessage('Network error occurred');
            setAlertStatus("error");
            setTimeout(() => setFlashMessage(''), 3000);
        }
    };



    const onChangeRoomConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'maxPlayers' && isNumber(parseInt(value))) {
            setConfigFormField({ ...configFormField, maxPlayers: parseInt(value) });
        } else {
            setConfigFormField({ ...configFormField, [name]: value });
        }
    };

    const onChangeRulesRequisite = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (['minimumPlayers', 'eachTeamPlayers', 'timeLimit', 'scoreLimit'].includes(name) && isNumber(parseInt(value))) {
            setRulesFormField({
                ...rulesFormField,
                requisite: { ...rulesFormField.requisite, [name]: parseInt(value) }
            });
        } else {
            setRulesFormField({
                ...rulesFormField,
                requisite: { ...rulesFormField.requisite, [name]: value }
            });
        }
    };

    return (
        <Container maxWidth="lg" className={classes.container}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper className={fixedHeightPaper}>
                        {flashMessage && <Alert severity={alertStatus}>{flashMessage}</Alert>}
                        <Title>Create Server Image</Title>

                        <form className={classes.form} onSubmit={handleSubmit} method="post">
                            <Typography component="h2" variant="subtitle1" color="primary" gutterBottom>
                                Image Information
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        id="imageName"
                                        name="imageName"
                                        label="Image Name"
                                        variant="outlined"
                                        margin="normal"
                                        size="small"
                                        required
                                        value={imageName}
                                        onChange={(e) => setImageName(e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        id="imageDescription"
                                        name="imageDescription"
                                        label="Description"
                                        variant="outlined"
                                        margin="normal"
                                        size="small"
                                        required
                                        multiline
                                        rows={2}
                                        value={imageDescription}
                                        onChange={(e) => setImageDescription(e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        id="imageRuid"
                                        name="imageRuid"
                                        label="Room UID (RUID)"
                                        variant="outlined"
                                        margin="normal"
                                        size="small"
                                        required
                                        value={imageRuid}
                                        onChange={(e) => setImageRuid(e.target.value)}
                                        helperText="Unique identifier for the room (alphanumeric, dash, underscore only)"
                                    />
                                </Grid>
                            </Grid>
                            

                            <Divider />

                            <Typography component="h2" variant="subtitle1" color="primary" gutterBottom>
                                Basic Configuration
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        id="roomName"
                                        name="roomName"
                                        label="Room Title"
                                        variant="outlined"
                                        margin="normal"
                                        size="small"
                                        required
                                        value={configFormField.roomName}
                                        onChange={onChangeRoomConfig}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField
                                        fullWidth
                                        id="playerName"
                                        name="playerName"
                                        label="Host Player Name"
                                        variant="outlined"
                                        margin="normal"
                                        size="small"
                                        value={configFormField.playerName || 'Host'}
                                        onChange={onChangeRoomConfig}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField
                                        fullWidth
                                        id="maxPlayers"
                                        name="maxPlayers"
                                        label="Max Players"
                                        variant="outlined"
                                        margin="normal"
                                        type="number"
                                        size="small"
                                        required
                                        value={configFormField.maxPlayers}
                                        onChange={onChangeRoomConfig}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField
                                        fullWidth
                                        id="password"
                                        name="password"
                                        label="Room Password (Optional)"
                                        variant="outlined"
                                        margin="normal"
                                        size="small"
                                        value={configFormField.password || ''}
                                        onChange={onChangeRoomConfig}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                id="public"
                                                name="public"
                                                size="small"
                                                checked={roomPublicFormField}
                                                onChange={(e) => setRoomPublicFormField(e.target.checked)}
                                                color="primary"
                                            />
                                        }
                                        label="Public Room"
                                        labelPlacement="top"
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                id="noPlayer"
                                                name="noPlayer"
                                                size="small"
                                                checked={configFormField.noPlayer || false}
                                                onChange={(e) => setConfigFormField({ ...configFormField, noPlayer: e.target.checked })}
                                                color="primary"
                                            />
                                        }
                                        label="No Player Mode"
                                        labelPlacement="top"
                                    />
                                </Grid>
                            </Grid>
                            <Divider />

                            <Typography component="h2" variant="subtitle1" color="primary" gutterBottom>
                                Game Rules
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        value={rulesFormField?.ruleName || ''}
                                        onChange={(e) => setRulesFormField({ ...rulesFormField, ruleName: e.target.value })}
                                        id="ruleName"
                                        name="ruleName"
                                        label="Rule Name"
                                        variant="outlined"
                                        margin="normal"
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        value={rulesFormField?.ruleDescription || ''}
                                        onChange={(e) => setRulesFormField({ ...rulesFormField, ruleDescription: e.target.value })}
                                        id="ruleDescription"
                                        name="ruleDescription"
                                        label="Rule Description"
                                        variant="outlined"
                                        margin="normal"
                                        size="small"
                                        multiline
                                        rows={2}
                                    />
                                </Grid>
                            </Grid>
                            <Grid container spacing={2}>
                                <Grid item xs={6} sm={3}>
                                    <TextField
                                        fullWidth
                                        value={rulesFormField?.requisite?.minimumPlayers || ''}
                                        onChange={onChangeRulesRequisite}
                                        id="minimumPlayers"
                                        name="minimumPlayers"
                                        label="Min Players"
                                        variant="outlined"
                                        margin="normal"
                                        type="number"
                                        size="small"
                                        required
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField
                                        fullWidth
                                        value={rulesFormField?.requisite?.eachTeamPlayers || ''}
                                        onChange={onChangeRulesRequisite}
                                        id="eachTeamPlayers"
                                        name="eachTeamPlayers"
                                        label="Players per Team"
                                        variant="outlined"
                                        margin="normal"
                                        type="number"
                                        size="small"
                                        required
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField
                                        fullWidth
                                        value={rulesFormField?.requisite?.timeLimit || ''}
                                        onChange={onChangeRulesRequisite}
                                        id="timeLimit"
                                        name="timeLimit"
                                        label="Time Limit (min)"
                                        variant="outlined"
                                        margin="normal"
                                        type="number"
                                        size="small"
                                        required
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField
                                        fullWidth
                                        value={rulesFormField?.requisite?.scoreLimit || ''}
                                        onChange={onChangeRulesRequisite}
                                        id="scoreLimit"
                                        name="scoreLimit"
                                        label="Score Limit"
                                        variant="outlined"
                                        margin="normal"
                                        type="number"
                                        size="small"
                                        required
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField
                                        fullWidth
                                        value={rulesFormField?.defaultMapName || ''}
                                        onChange={(e) => setRulesFormField({ ...rulesFormField, defaultMapName: e.target.value })}
                                        id="defaultMapName"
                                        name="defaultMapName"
                                        label="Default Map"
                                        variant="outlined"
                                        margin="normal"
                                        size="small"
                                        required
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField
                                        fullWidth
                                        value={rulesFormField?.readyMapName || ''}
                                        onChange={(e) => setRulesFormField({ ...rulesFormField, readyMapName: e.target.value })}
                                        id="readyMapName"
                                        name="readyMapName"
                                        label="Ready Map"
                                        variant="outlined"
                                        margin="normal"
                                        size="small"
                                        required
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField
                                        fullWidth
                                        value={rulesFormField?.customJSONOptions || ''}
                                        onChange={(e) => setRulesFormField({ ...rulesFormField, customJSONOptions: e.target.value })}
                                        id="customJSONOptions"
                                        name="customJSONOptions"
                                        label="Custom JSON Options"
                                        variant="outlined"
                                        margin="normal"
                                        size="small"
                                        multiline
                                        rows={2}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                onChange={(e) => setRulesTeamLockField(e.target.checked)}
                                                checked={rulesTeamLockField}
                                                id="teamLock"
                                                name="teamLock"
                                                size="small"
                                                color="primary"
                                            />
                                        }
                                        label="Team Lock"
                                        labelPlacement="top"
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                onChange={(e) => setRulesSwitchesFormField({ ...rulesSwitchesFormField, autoAdmin: e.target.checked })}
                                                checked={rulesSwitchesFormField.autoAdmin}
                                                id="autoAdmin"
                                                name="autoAdmin"
                                                size="small"
                                                color="primary"
                                            />
                                        }
                                        label="Auto Admin"
                                        labelPlacement="top"
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                onChange={(e) => setRulesSwitchesFormField({ ...rulesSwitchesFormField, autoOperating: e.target.checked })}
                                                checked={rulesSwitchesFormField.autoOperating}
                                                id="autoOperating"
                                                name="autoOperating"
                                                size="small"
                                                color="primary"
                                            />
                                        }
                                        label="Auto Operating"
                                        labelPlacement="top"
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                onChange={(e) => setRulesSwitchesFormField({ ...rulesSwitchesFormField, statsRecord: e.target.checked })}
                                                checked={rulesSwitchesFormField.statsRecord}
                                                id="statsRecord"
                                                name="statsRecord"
                                                size="small"
                                                color="primary"
                                            />
                                        }
                                        label="Stats Record"
                                        labelPlacement="top"
                                    />
                                </Grid>
                            </Grid>
                            <Divider style={{ margin: '16px 0' }} />

                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="subtitle1" color="primary">Advanced Settings</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" gutterBottom>Anti-Flood & Behavior Settings</Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <TextField
                                                fullWidth
                                                value={settingsFormField?.maliciousBehaviourBanCriterion || ''}
                                                onChange={(e) => setSettingsFormField({ ...settingsFormField, maliciousBehaviourBanCriterion: parseInt(e.target.value) || 0 })}
                                                label="Malicious Ban Criterion"
                                                type="number"
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <TextField
                                                fullWidth
                                                value={settingsFormField?.afkCountLimit || ''}
                                                onChange={(e) => setSettingsFormField({ ...settingsFormField, afkCountLimit: parseInt(e.target.value) || 0 })}
                                                label="AFK Count Limit"
                                                type="number"
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <TextField
                                                fullWidth
                                                value={settingsFormField?.nicknameLengthLimit || ''}
                                                onChange={(e) => setSettingsFormField({ ...settingsFormField, nicknameLengthLimit: parseInt(e.target.value) || 0 })}
                                                label="Nickname Length Limit"
                                                type="number"
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <TextField
                                                fullWidth
                                                value={settingsFormField?.chatLengthLimit || ''}
                                                onChange={(e) => setSettingsFormField({ ...settingsFormField, chatLengthLimit: parseInt(e.target.value) || 0 })}
                                                label="Chat Length Limit"
                                                type="number"
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={settingsFormField?.banVoteEnable || false}
                                                        onChange={(e) => setSettingsFormField({ ...settingsFormField, banVoteEnable: e.target.checked })}
                                                        size="small"
                                                        color="primary"
                                                    />
                                                }
                                                label="Ban Vote Enable"
                                                labelPlacement="top"
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={settingsFormField?.afkCommandAutoKick || false}
                                                        onChange={(e) => setSettingsFormField({ ...settingsFormField, afkCommandAutoKick: e.target.checked })}
                                                        size="small"
                                                        color="primary"
                                                    />
                                                }
                                                label="AFK Auto Kick"
                                                labelPlacement="top"
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={settingsFormField?.chatFiltering || false}
                                                        onChange={(e) => setSettingsFormField({ ...settingsFormField, chatFiltering: e.target.checked })}
                                                        size="small"
                                                        color="primary"
                                                    />
                                                }
                                                label="Chat Filtering"
                                                labelPlacement="top"
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={settingsFormField?.antiJoinFlood || false}
                                                        onChange={(e) => setSettingsFormField({ ...settingsFormField, antiJoinFlood: e.target.checked })}
                                                        size="small"
                                                        color="primary"
                                                    />
                                                }
                                                label="Anti Join Flood"
                                                labelPlacement="top"
                                            />
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>

                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="subtitle1" color="primary">Ball Physics Settings</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6} sm={3}>
                                            <TextField
                                                fullWidth
                                                value={settingsFormField?.ballRadius || ''}
                                                onChange={(e) => setSettingsFormField({ ...settingsFormField, ballRadius: parseFloat(e.target.value) || 0 })}
                                                label="Ball Radius"
                                                type="number"
                                                variant="outlined"
                                                size="small"
                                                inputProps={{ step: 0.1 }}
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <TextField
                                                fullWidth
                                                value={settingsFormField?.ballBCoeff || ''}
                                                onChange={(e) => setSettingsFormField({ ...settingsFormField, ballBCoeff: parseFloat(e.target.value) || 0 })}
                                                label="Ball Bounce Coefficient"
                                                type="number"
                                                variant="outlined"
                                                size="small"
                                                inputProps={{ step: 0.1 }}
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <TextField
                                                fullWidth
                                                value={settingsFormField?.ballInvMass || ''}
                                                onChange={(e) => setSettingsFormField({ ...settingsFormField, ballInvMass: parseFloat(e.target.value) || 0 })}
                                                label="Ball Inverse Mass"
                                                type="number"
                                                variant="outlined"
                                                size="small"
                                                inputProps={{ step: 0.1 }}
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <TextField
                                                fullWidth
                                                value={settingsFormField?.ballDamping || ''}
                                                onChange={(e) => setSettingsFormField({ ...settingsFormField, ballDamping: parseFloat(e.target.value) || 0 })}
                                                label="Ball Damping"
                                                type="number"
                                                variant="outlined"
                                                size="small"
                                                inputProps={{ step: 0.01 }}
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <TextField
                                                fullWidth
                                                value={settingsFormField?.ballColor || ''}
                                                onChange={(e) => setSettingsFormField({ ...settingsFormField, ballColor: e.target.value })}
                                                label="Ball Color (hex)"
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={settingsFormField?.powershotEnabled || false}
                                                        onChange={(e) => setSettingsFormField({ ...settingsFormField, powershotEnabled: e.target.checked })}
                                                        size="small"
                                                        color="primary"
                                                    />
                                                }
                                                label="Powershot Enabled"
                                                labelPlacement="top"
                                            />
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>

                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="subtitle1" color="primary">Rating System (HElo)</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" gutterBottom>Rating Factors</Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <TextField
                                                fullWidth
                                                value={heloFormField?.factor?.placement_match_chances || ''}
                                                onChange={(e) => setHeloFormField({ 
                                                    ...heloFormField, 
                                                    factor: { ...heloFormField.factor, placement_match_chances: parseInt(e.target.value) || 0 }
                                                })}
                                                label="Placement Matches"
                                                type="number"
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <TextField
                                                fullWidth
                                                value={heloFormField?.factor?.factor_k_placement || ''}
                                                onChange={(e) => setHeloFormField({ 
                                                    ...heloFormField, 
                                                    factor: { ...heloFormField.factor, factor_k_placement: parseInt(e.target.value) || 0 }
                                                })}
                                                label="K Factor Placement"
                                                type="number"
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <TextField
                                                fullWidth
                                                value={heloFormField?.factor?.factor_k_normal || ''}
                                                onChange={(e) => setHeloFormField({ 
                                                    ...heloFormField, 
                                                    factor: { ...heloFormField.factor, factor_k_normal: parseInt(e.target.value) || 0 }
                                                })}
                                                label="K Factor Normal"
                                                type="number"
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <TextField
                                                fullWidth
                                                value={heloFormField?.factor?.factor_k_replace || ''}
                                                onChange={(e) => setHeloFormField({ 
                                                    ...heloFormField, 
                                                    factor: { ...heloFormField.factor, factor_k_replace: parseInt(e.target.value) || 0 }
                                                })}
                                                label="K Factor Replace"
                                                type="number"
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" gutterBottom>Tier Thresholds</Typography>
                                        </Grid>
                                        {[1,2,3,4,5,6,7,8,9].map(tier => (
                                            <Grid item xs={6} sm={3} key={tier}>
                                                <TextField
                                                    fullWidth
                                                    value={heloFormField?.tier?.[`class_tier_${tier}` as keyof typeof heloFormField.tier] || ''}
                                                    onChange={(e) => setHeloFormField({ 
                                                        ...heloFormField, 
                                                        tier: { ...heloFormField.tier, [`class_tier_${tier}`]: parseInt(e.target.value) || 0 }
                                                    })}
                                                    label={`Tier ${tier} Threshold`}
                                                    type="number"
                                                    variant="outlined"
                                                    size="small"
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>

                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="subtitle1" color="primary">Commands Configuration</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                value={commandsFormField?._commandPrefix || ''}
                                                onChange={(e) => setCommandsFormField({ ...commandsFormField, _commandPrefix: e.target.value })}
                                                label="Command Prefix"
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="textSecondary">
                                                Note: Individual command mappings can be configured after creation
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>

                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="subtitle1" color="primary">Discord Webhook Configuration</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                                Configure Discord webhooks for specific functions. Each webhook goes to a dedicated Discord channel.
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                value={discordWebhook.replayUrl}
                                                onChange={(e) => setDiscordWebhook({ ...discordWebhook, replayUrl: e.target.value })}
                                                label="Replay Upload Webhook URL"
                                                variant="outlined"
                                                size="small"
                                                placeholder="https://discord.com/api/webhooks/123456789/abcdefghijklmnop"
                                                helperText="Webhook URL for automatic replay uploads after games - goes to replays channel (optional)"
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                value={discordWebhook.adminCallUrl}
                                                onChange={(e) => setDiscordWebhook({ ...discordWebhook, adminCallUrl: e.target.value })}
                                                label="Admin Call Webhook URL"
                                                variant="outlined"
                                                size="small"
                                                placeholder="https://discord.com/api/webhooks/123456789/abcdefghijklmnop"
                                                helperText="Webhook URL for !llamaradmin command notifications - goes to admin channel (optional)"
                                            />
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>

                            <Grid container spacing={2} style={{ marginTop: 16 }}>
                                <Grid item xs={6} sm={3}>
                                    <Button
                                        fullWidth
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        className={classes.submit}
                                    >
                                        Save Image
                                    </Button>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        color="secondary"
                                        className={classes.submit}
                                        onClick={() => history.push('/admin/serverimages')}
                                    >
                                        Cancel
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </Paper>
                </Grid>
            </Grid>
            <Box pt={4}>
                <Copyright />
            </Box>
        </Container>
    );
}