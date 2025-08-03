import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../../lib/client';
import ServerImageCreate from './ServerImageCreate';

interface EditParams {
    imageId: string;
}

interface ServerImageCreateEditProps {
    styleClass: any;
}

export default function ServerImageCreateEdit({ styleClass }: ServerImageCreateEditProps) {
    const { imageId } = useParams<EditParams>();
    const [editData, setEditData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadImageData = async () => {
            try {
                setLoading(true);
                console.log('Loading image with ID:', imageId);
                const result = await client.get(`/api/v1/images/${imageId}`);
                console.log('API response:', result);
                if (result.status === 200) {
                    console.log('Full image data structure:', result.data);
                    setEditData(result.data);
                } else {
                    setError('Failed to load image data');
                }
            } catch (error) {
                setError('Failed to load image data');
                console.error('Error loading image:', error);
            } finally {
                setLoading(false);
            }
        };

        if (imageId) {
            loadImageData();
        }
    }, [imageId]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!editData) {
        return <div>Image not found</div>;
    }

    return (
        <ServerImageCreate 
            styleClass={styleClass}
            editMode={true}
            editData={editData}
            editImageId={imageId}
        />
    );
}
