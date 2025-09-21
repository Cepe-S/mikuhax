import React from 'react';
import { Link as RouterLink  } from 'react-router-dom';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import DashboardIcon from '@material-ui/icons/Dashboard';
import ImageIcon from '@material-ui/icons/Image';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import AddPhotoAlternateIcon from '@material-ui/icons/AddPhotoAlternate';

export default function MainboardSideMenu() {
    return (
        <>
            <List>
                <div>
                    <ListItem button component={RouterLink} to="/admin">
                        <ListItemIcon>
                            <DashboardIcon />
                        </ListItemIcon>
                        <ListItemText primary="Dashboard" />
                    </ListItem>
                </div>
            </List>
            <Divider />
            <List>
                <div>
                    <ListSubheader inset>Image Management</ListSubheader>
                    <ListItem button component={RouterLink} to="/admin/serverimages">
                        <ListItemIcon>
                            <ImageIcon />
                        </ListItemIcon>
                        <ListItemText primary="Server Images" />
                    </ListItem>
                    <ListItem button component={RouterLink} to="/admin/newimage">
                        <ListItemIcon>
                            <AddPhotoAlternateIcon />
                        </ListItemIcon>
                        <ListItemText primary="New Image" />
                    </ListItem>
                </div>
            </List>
        </>
    );
}
