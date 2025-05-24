import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './LocationSelectionModal.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map center and zoom updates
const MapController = ({ position }) => {
    const map = useMap();
    
    useEffect(() => {
        if (position) {
            map.setView(position, 16); // Set zoom level to 16 for closer view
        }
    }, [position, map]);

    return null;
};

const LocationMarker = ({ position, setPosition, selectedLocations, setSelectedLocations }) => {
    useMapEvents({
        click(e) {
            const newLocation = [e.latlng.lat, e.latlng.lng];
            setPosition(newLocation);
            
            // Add new location to selected locations if not already present
            const locationExists = selectedLocations.some(
                loc => loc[0] === newLocation[0] && loc[1] === newLocation[1]
            );
            
            if (!locationExists) {
                setSelectedLocations([...selectedLocations, newLocation]);
            }
        },
    });

    return null;
};

const LocationSelectionModal = ({ onClose, onLocationsSelect, initialLocations = [] }) => {
    const [position, setPosition] = useState(null);
    const [selectedLocations, setSelectedLocations] = useState(initialLocations);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get user's current location
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const currentPos = [pos.coords.latitude, pos.coords.longitude];
                setPosition(currentPos);
                // Add current location as first selected location
                setSelectedLocations([currentPos]);
                setLoading(false);
            },
            (err) => {
                console.error('Error getting location:', err);
                // Default to a fallback position if geolocation fails
                const defaultPos = [23.8103, 90.4125]; // Default to Dhaka
                setPosition(defaultPos);
                setSelectedLocations([defaultPos]);
                setLoading(false);
            }
        );
    }, []);

    const handleLocationRemove = (index) => {
        setSelectedLocations(selectedLocations.filter((_, i) => i !== index));
    };

    const handleConfirm = () => {
        if (selectedLocations.length >= 2) {
            onLocationsSelect(selectedLocations.map(loc => ({
                lat: loc[0],
                lng: loc[1],
                timestamp: new Date().toISOString()
            })));
        }
    };

    if (loading) {
        return <div className="location-modal-loading">Loading map...</div>;
    }

    return (
        <div className="location-modal-overlay">
            <div className="location-modal">
                <div className="location-modal-header">
                    <h3>Select Meeting Locations</h3>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
                
                <div className="location-modal-content">
                    <div className="location-map">
                        <MapContainer
                            center={position || [23.8103, 90.4125]}
                            zoom={16}
                            style={{ height: '400px', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <MapController position={position} />
                            <LocationMarker
                                position={position}
                                setPosition={setPosition}
                                selectedLocations={selectedLocations}
                                setSelectedLocations={setSelectedLocations}
                            />
                            {selectedLocations.map((loc, index) => (
                                <Marker
                                    key={index}
                                    position={loc}
                                    eventHandlers={{
                                        click: () => handleLocationRemove(index)
                                    }}
                                />
                            ))}
                        </MapContainer>
                    </div>

                    <div className="selected-locations">
                        <h4>Selected Locations ({selectedLocations.length}/2 minimum)</h4>
                        <div className="location-list">
                            {selectedLocations.map((loc, index) => (
                                <div key={index} className="location-item">
                                    <span>Location {index + 1}: {loc[0].toFixed(6)}, {loc[1].toFixed(6)}</span>
                                    <button
                                        onClick={() => handleLocationRemove(index)}
                                        className="remove-location-btn"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="location-modal-footer">
                    <button
                        className="confirm-locations-btn"
                        onClick={handleConfirm}
                        disabled={selectedLocations.length < 2}
                    >
                        Confirm Locations
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocationSelectionModal; 