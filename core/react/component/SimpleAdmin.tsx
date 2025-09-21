// Frontend: Simple admin interface for server images
import React, { useState, useEffect } from 'react';

interface ServerImage {
    id: string;
    name: string;
    config: {
        serverName: string;
        maxPlayers: number;
        scoreLimit: number;
        timeLimit: number;
        defaultStadium: string;
    };
    active: boolean;
}

export const SimpleAdmin: React.FC = () => {
    const [images, setImages] = useState<ServerImage[]>([]);

    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async () => {
        try {
            const response = await fetch('/api/v1/server-images');
            if (response.ok) {
                const data = await response.json();
                setImages(data);
            }
        } catch (error) {
            console.error('Failed to load images:', error);
        }
    };

    const activateImage = async (imageId: string) => {
        try {
            const response = await fetch(`/api/v1/server-images/${imageId}/activate`, {
                method: 'POST'
            });
            if (response.ok) {
                loadImages();
            }
        } catch (error) {
            console.error('Failed to activate image:', error);
        }
    };

    return (
        <div className="simple-admin">
            <h1>Server Images</h1>
            
            <div className="images-list">
                {images.map(image => (
                    <div key={image.id} className={`image-card ${image.active ? 'active' : ''}`}>
                        <h3>{image.name}</h3>
                        <p>Server: {image.config.serverName}</p>
                        <p>Players: {image.config.maxPlayers}</p>
                        <p>Score Limit: {image.config.scoreLimit}</p>
                        <p>Time Limit: {image.config.timeLimit}</p>
                        
                        {!image.active && (
                            <button onClick={() => activateImage(image.id)}>
                                Activate
                            </button>
                        )}
                        
                        {image.active && <span className="active-badge">ACTIVE</span>}
                    </div>
                ))}
            </div>
        </div>
    );
};