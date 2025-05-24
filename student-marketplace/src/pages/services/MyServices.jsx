import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { getServices, deleteService } from '../../services/services';
import './services.css';

const MyServices = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            fetchMyServices();
        }
    }, [user]);

    const fetchMyServices = async () => {
        try {
            setLoading(true);
            setError('');
            const { services } = await getServices({ userId: user.uid });
            setServices(services);
        } catch (error) {
            console.error('Error fetching services:', error);
            setError('Failed to load your services. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = (serviceId) => {
        navigate(`/services/${serviceId}/edit`);
    };

    const handleDelete = async (serviceId) => {
        if (window.confirm('Are you sure you want to delete this service?')) {
            try {
                await deleteService(serviceId);
                setServices(services.filter(service => service.id !== serviceId));
            } catch (error) {
                console.error('Error deleting service:', error);
                setError('Failed to delete service. Please try again.');
            }
        }
    };

    if (loading) {
        return <div className="loading">Loading your services...</div>;
    }

    return (
        <div className="my-services-container">
            <div className="services-header">
                <h2>My Services</h2>
                <Link to="/offer-service" className="offer-service-button">Offer New Service</Link>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="services-grid">
                {services.length === 0 ? (
                    <div className="no-services">You have no active services.</div>
                ) : (
                    services.map(service => (                        <div key={service.id} className="service-card">                            <div className="service-image">
                                <img src={service.providerImage || '/default-service.svg'} alt={service.title} />
                            </div>
                            <div className="service-details">
                                <h3>{service.title}</h3>
                                <p className="rate">৳{service.hourlyRate}/hour</p>
                                <div className="skills">
                                    {service.skills.map((skill, index) => (
                                        <span key={index} className="skill-tag">{skill}</span>
                                    ))}
                                </div>
                                <p className="skill-level">{service.skillLevel}</p>
                                <p className="availability">{service.availability}</p>
                                <div className="service-actions">
                                    <button 
                                        className="edit-button"
                                        onClick={() => handleUpdate(service.id)}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className="delete-button"
                                        onClick={() => handleDelete(service.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyServices;
