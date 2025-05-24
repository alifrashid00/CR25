import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './LocationPicker.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMarker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });

    return position ? <Marker position={position} /> : null;
};

const LocationPicker = ({ onLocationSelect, initialPosition }) => {
    const [position, setPosition] = useState(initialPosition || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!initialPosition) {
            // Get user's current location
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition([pos.coords.latitude, pos.coords.longitude]);
                    setLoading(false);
                },
                (err) => {
                    console.error('Error getting location:', err);
                    // Default to a fallback position if geolocation fails
                    setPosition([23.8103, 90.4125]); // Default to Dhaka
                    setLoading(false);
                }
            );
        } else {
            setLoading(false);
        }
    }, [initialPosition]);

    const handleLocationConfirm = () => {
        if (position) {
            onLocationSelect({
                lat: position[0],
                lng: position[1],
                timestamp: new Date().toISOString()
            });
        }
    };

    if (loading) {
        return <div className="location-picker-loading">Loading map...</div>;
    }

    return (
        <div className="location-picker">
            <MapContainer
                center={position || [23.8103, 90.4125]}
                zoom={13}
                style={{ height: '400px', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
            <div className="location-picker-actions">
                <button
                    onClick={handleLocationConfirm}
                    disabled={!position}
                    className="confirm-location-btn"
                >
                    Confirm Location
                </button>
            </div>
        </div>
    );
};

export default LocationPicker; 