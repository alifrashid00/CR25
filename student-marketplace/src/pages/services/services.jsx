import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { getServices } from '../../services/services';
import './services.css';

const Services = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [allServices, setAllServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        category: '',
        minRate: '',
        maxRate: '',
        skillLevel: '',
        university: '',
        availability: '',
        searchQuery: ''
    });

    useEffect(() => {
        const fetchServices = async () => {
            try {
                setLoading(true);
                setError('');
                const { services } = await getServices();
                setAllServices(services);
                setFilteredServices(services);
            } catch (error) {
                console.error('Error fetching services:', error);
                setError('Failed to load services. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const applyFilters = () => {
        let filtered = [...allServices];

        // Apply search filter
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(service => 
                service.title.toLowerCase().includes(query) ||
                service.description.toLowerCase().includes(query) ||
                service.skills.some(skill => skill.toLowerCase().includes(query))
            );
        }

        // Apply category filter
        if (filters.category) {
            filtered = filtered.filter(service => service.category === filters.category);
        }

        // Apply skill level filter
        if (filters.skillLevel) {
            filtered = filtered.filter(service => service.skillLevel === filters.skillLevel);
        }

        // Apply availability filter
        if (filters.availability) {
            filtered = filtered.filter(service => service.availability === filters.availability);
        }

        // Apply university filter
        if (filters.university) {
            filtered = filtered.filter(service => service.university === filters.university);
        }

        // Apply rate range filter
        const minRate = filters.minRate ? Number(filters.minRate) : 0;
        const maxRate = filters.maxRate ? Number(filters.maxRate) : Infinity;
        
        filtered = filtered.filter(service => {
            const rate = service.hourlyRate;
            return rate >= minRate && rate <= maxRate;
        });

        setFilteredServices(filtered);
    };

    const clearFilters = () => {
        const emptyFilters = {
            category: '',
            minRate: '',
            maxRate: '',
            skillLevel: '',
            university: '',
            availability: '',
            searchQuery: ''
        };
        setFilters(emptyFilters);
        setFilteredServices(allServices);
    };

    if (loading) {
        return <div className="loading">Loading services...</div>;
    }

    return (
        <div className="services-container">
            <div className="filters-section">
                <div className="filters-header">
                    <h2>Filters</h2>
                    <button className="clear-filters" onClick={clearFilters}>
                        Clear All
                    </button>
                </div>
                <form className="filters-form" onSubmit={(e) => { e.preventDefault(); applyFilters(); }}>
                    <div className="filter-group">
                        <label htmlFor="searchQuery">Search</label>
                        <input
                            type="text"
                            id="searchQuery"
                            name="searchQuery"
                            value={filters.searchQuery}
                            onChange={handleFilterChange}
                            placeholder="Search services..."
                        />
                    </div>

                    <div className="filter-group">
                        <label htmlFor="category">Category</label>
                        <select
                            id="category"
                            name="category"
                            value={filters.category}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Categories</option>
                            <option value="Tutoring">Tutoring</option>
                            <option value="Programming">Programming</option>
                            <option value="Design">Design</option>
                            <option value="Writing">Writing</option>
                            <option value="Language">Language</option>
                            <option value="Music">Music</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="rateRange">Hourly Rate (৳)</label>
                        <div className="rate-range-inputs">
                            <input
                                type="number"
                                id="minRate"
                                name="minRate"
                                value={filters.minRate}
                                onChange={handleFilterChange}
                                placeholder="Min Rate"
                                min="0"
                            />
                            <span className="rate-separator">-</span>
                            <input
                                type="number"
                                id="maxRate"
                                name="maxRate"
                                value={filters.maxRate}
                                onChange={handleFilterChange}
                                placeholder="Max Rate"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="skillLevel">Skill Level</label>
                        <select
                            id="skillLevel"
                            name="skillLevel"
                            value={filters.skillLevel}
                            onChange={handleFilterChange}
                        >
                            <option value="">Any Level</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="expert">Expert</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="availability">Availability</label>
                        <select
                            id="availability"
                            name="availability"
                            value={filters.availability}
                            onChange={handleFilterChange}
                        >
                            <option value="">Any Time</option>
                            <option value="weekdays">Weekdays</option>
                            <option value="weekends">Weekends</option>
                            <option value="evenings">Evenings</option>
                            <option value="flexible">Flexible</option>
                        </select>
                    </div>

                    <button type="submit" className="apply-filters-button">
                        Apply Filters
                    </button>
                </form>
            </div>

            <div className="services-content">
                <div className="services-header">
                    <h1>Find Services</h1>
                    <button
                        className="offer-service-button"
                        onClick={() => navigate('/offer-service')}
                    >
                        Offer a Service
                    </button>
                </div>

                <div className="services-grid">
                    {error && <div className="error-message">{error}</div>}
                    
                    {filteredServices.length === 0 ? (
                        <div className="no-services">No services found matching your criteria</div>
                    ) : (
                        filteredServices.map(service => (
                            <div 
                                key={service.id} 
                                className="service-card"
                                onClick={() => navigate(`/services/${service.id}`)}
                            >
                                <div className="service-image">
                                    {service.providerImage ? (
                                        <img 
                                            src={service.providerImage} 
                                            alt={service.title}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '/default-service.png';
                                            }}
                                        />
                                    ) : (
                                        <div className="default-image">
                                            {service.providerName?.[0] || 'A'}
                                        </div>
                                    )}
                                </div>
                                <div className="service-content">
                                    <h3 className="service-title">{service.title}</h3>
                                    <p className="service-provider">{service.providerName}</p>
                                    <div className="service-rating">
                                        <span className="stars">★</span>
                                        <span className="rating-value">
                                            {service.providerRating ? service.providerRating.toFixed(1) : 'New'}
                                        </span>
                                        {service.totalRatings > 0 && (
                                            <span className="total-ratings">
                                                ({service.totalRatings})
                                            </span>
                                        )}
                                    </div>
                                    <div className="service-details">
                                        <span className="service-category">{service.category}</span>
                                        <span className="service-rate">৳{service.hourlyRate}/hr</span>
                                    </div>
                                    <div className="service-skills">
                                        {service.skills.slice(0, 3).map((skill, index) => (
                                            <span key={index} className="skill-tag">{skill}</span>
                                        ))}
                                        {service.skills.length > 3 && (
                                            <span className="more-skills">+{service.skills.length - 3} more</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Services; 