import React, { useEffect, useState } from 'react';
import Link from '@material-ui/core/Link';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Title from './common/Widget.Title';
import client from '../../lib/client';
import { Link as RouterLink } from 'react-router-dom';

interface imageInfoItem {
    id: string
    name: string
    status: string
}

const useStyles = makeStyles((theme) => ({
    seeMore: {
        marginTop: theme.spacing(3),
    },
}));

export default function ImageWidget() {
    const classes = useStyles();
    const [imageInfoList, setImageInfoList] = useState([] as imageInfoItem[]);

    const getImageList = async () => {
        try {
            const result = await client.get('/api/v1/serverimage');
            if(result.status === 200) {
                const images = result.data.slice(0, 3).map((image: any) => ({
                    id: image.id,
                    name: image.name,
                    status: image.status || 'Ready'
                }));
                setImageInfoList(images);
            }
        } catch (e) { }
    }

    useEffect(() => {
        getImageList();
        return (() => {
            setImageInfoList([]);
        });
    }, []);

    return (
        <React.Fragment>
            <Title>Recent Server Images</Title>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell align="right">Status</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {imageInfoList.map((item, idx) => (
                        <TableRow key={idx}>
                            <TableCell>{item.id}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell align="right">{item.status}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className={classes.seeMore}>
                <Link component={RouterLink} to="/admin/serverimages" variant="body2" color="primary">
                    See all server images
                </Link>
            </div>
        </React.Fragment>
    );
}