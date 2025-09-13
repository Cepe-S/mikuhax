import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Copyright from '../common/Footer.Copyright';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Title from './common/Widget.Title';
import client from '../../lib/client';
import { useParams } from 'react-router-dom';
import { Button, Divider, IconButton, TextField, Typography } from '@material-ui/core';
import BackspaceIcon from '@material-ui/icons/Backspace';
import Alert, { AlertColor } from '../common/Alert';
import { isNumber } from '../../lib/numcheck';

interface styleClass {
    styleClass: any
}

interface muteListItem {
    auth: string
    playerName: string
    reason: string
    createdAt: number
    expiresAt: number
    adminName: string
    isActive: boolean
}

interface newMuteFields {
    auth: string
    playerName: string
    reason: string
    durationMinutes: number
}

interface matchParams {
    ruid: string
}

export default function RoomMuteList({ styleClass }: styleClass) {
    const classes = styleClass;
    const fixedHeightPaper = clsx(classes.paper, classes.fullHeight);
    const matchParams: matchParams = useParams();

    const [muteList, setMuteList] = useState([] as muteListItem[]);
    const [newMute, setNewMute] = useState({ auth: '', playerName: '', reason: '', durationMinutes: 0 } as newMuteFields);

    const [flashMessage, setFlashMessage] = useState('');
    const [alertStatus, setAlertStatus] = useState("success" as AlertColor);

    const [pagingOrder, setPagingOrder] = useState(1);
    const [pagingCount, setPagingCount] = useState(10);
    const [pagingCountInput, setPagingCountInput] = useState('10');

    const convertDate = (timestamp: number): string => {
        return new Date(timestamp).toLocaleString();
    }

    const getMuteList = async (page: number) => {
        const index: number = (page - 1) * pagingCount;
        try {
            const result = await client.get(`/api/v1/sanctions/${matchParams.ruid}/mutes?start=${index}&count=${pagingCount}`);
            if (result.status === 200) {
                const muteList: muteListItem[] = result.data;
                setMuteList(muteList);
            }
        } catch (error) {
            setAlertStatus('error');
            if (error.response?.status === 404) {
                setFlashMessage('Failed to load list.');
                setMuteList([]);
            } else {
                setFlashMessage('Unexpected error is caused. Please try again.');
            }
        }
    }

    const onClickMuteDelete = async (auth: string) => {
        try {
            const result = await client.delete(`/api/v1/sanctions/${matchParams.ruid}/mutes/${auth}`);
            if (result.status === 204) {
                setFlashMessage('Successfully deleted.');
                setAlertStatus('success');
                setTimeout(() => {
                    setFlashMessage('');
                }, 3000);
            }
        } catch (error) {
            setFlashMessage('Failed to delete the mute.');
            setTimeout(() => {
                setFlashMessage('');
                setAlertStatus('error');
            }, 3000);
        }
        getMuteList(pagingOrder);
    }

    const onClickPaging = (move: number) => {
        if (pagingOrder + move >= 1) {
            setPagingOrder(pagingOrder + move);
            getMuteList(pagingOrder + move);
        }
    }

    const onChangePagingCountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPagingCountInput(e.target.value);

        if (isNumber(parseInt(e.target.value))) {
            const count: number = parseInt(e.target.value);
            if (count >= 1) {
                setPagingCount(count);
            }
        }
    }

    const onChangeNewMute = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === "durationMinutes" && isNumber(parseInt(value))) {
            setNewMute({
                ...newMute,
                durationMinutes: parseInt(value)
            });
        } else {
            setNewMute({
                ...newMute,
                [name]: value
            });
        }
    }

    const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const result = await client.post(`/api/v1/sanctions/${matchParams.ruid}/mutes`, {
                auth: newMute.auth,
                playerName: newMute.playerName,
                reason: newMute.reason,
                durationMinutes: newMute.durationMinutes
            });
            if (result.status === 204) {
                setFlashMessage('Successfully muted.');
                setAlertStatus('success');
                setNewMute({ auth: '', playerName: '', reason: '', durationMinutes: 0 });
                setTimeout(() => {
                    setFlashMessage('');
                }, 3000);
            }
        } catch (error) {
            setFlashMessage('Failed to mute.');
            setAlertStatus('error');
            setTimeout(() => {
                setFlashMessage('');
            }, 3000);
        }
        getMuteList(pagingOrder);
    }

    useEffect(() => {
        getMuteList(1);
    }, []);

    return (
        <Container maxWidth="lg" className={classes.container}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper className={fixedHeightPaper}>
                        <React.Fragment>
                            {flashMessage && <Alert severity={alertStatus}>{flashMessage}</Alert>}
                            <Title>Mute List</Title>
                            <Grid container spacing={2}>
                                <form className={classes.form} onSubmit={handleAdd} method="post">
                                    <Grid item xs={12} sm={12}>
                                        <TextField
                                            variant="outlined" margin="normal" required size="small" value={newMute.auth} onChange={onChangeNewMute}
                                            id="auth" label="Player Auth" name="auth"
                                        />
                                        <TextField
                                            variant="outlined" margin="normal" required size="small" value={newMute.playerName} onChange={onChangeNewMute}
                                            id="playerName" label="Player Name" name="playerName"
                                        />
                                        <TextField
                                            variant="outlined" margin="normal" required size="small" value={newMute.reason} onChange={onChangeNewMute}
                                            id="reason" label="Reason" name="reason"
                                        />
                                        <TextField
                                            variant="outlined" margin="normal" required size="small" value={newMute.durationMinutes} onChange={onChangeNewMute} type="number"
                                            id="durationMinutes" label="Duration (minutes, 0=permanent)" name="durationMinutes"
                                        />
                                        <Button size="small" type="submit" variant="contained" color="primary" className={classes.submit}>Mute</Button>
                                    </Grid>
                                </form>
                            </Grid>
                            <Divider />

                            <Grid container spacing={1}>
                                <Grid item xs={8} sm={4}>
                                    <Button onClick={() => onClickPaging(-1)} size="small" type="button" variant="outlined" color="inherit" className={classes.submit}>&lt;&lt;</Button>
                                    <Button onClick={() => onClickPaging(1)} size="small" type="button" variant="outlined" color="inherit" className={classes.submit}>&gt;&gt;</Button>

                                    <TextField
                                        variant="outlined"
                                        margin="normal"
                                        size="small"
                                        id="pagingCountInput"
                                        label="Paging Items Count"
                                        name="pagingCountInput"
                                        type="number"
                                        value={pagingCountInput}
                                        onChange={onChangePagingCountInput}
                                    />

                                    <Typography>Page {pagingOrder}</Typography>
                                </Grid>
                            </Grid>
                            <Divider />

                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Player</TableCell>
                                        <TableCell>Reason</TableCell>
                                        <TableCell>Admin</TableCell>
                                        <TableCell>Created</TableCell>
                                        <TableCell>Expires</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right"></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {muteList.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{item.playerName || 'Unknown'}</TableCell>
                                            <TableCell>{item.reason}</TableCell>
                                            <TableCell>{item.adminName || 'System'}</TableCell>
                                            <TableCell>{convertDate(item.createdAt)}</TableCell>
                                            <TableCell>{item.expiresAt === 0 ? 'Permanent' : convertDate(item.expiresAt)}</TableCell>
                                            <TableCell>{item.isActive ? '🔴 Active' : '🟢 Expired'}</TableCell>
                                            <TableCell align="right">
                                                <IconButton onClick={() => onClickMuteDelete(item.auth)} aria-label="delete" className={classes.margin}>
                                                    <BackspaceIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </React.Fragment>
                    </Paper>
                </Grid>
            </Grid>
            <Box pt={4}>
                <Copyright />
            </Box>
        </Container>
    );
}