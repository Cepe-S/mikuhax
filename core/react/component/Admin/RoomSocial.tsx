import React from 'react';

interface RoomSocialProps {
    styleClass?: any;
}

const RoomSocial: React.FC<RoomSocialProps> = ({ styleClass }) => {
    return (
        <div>
            <h3>Social Settings</h3>
            <p>Discord webhook configuration will be available here.</p>
        </div>
    );
};

export default RoomSocial;