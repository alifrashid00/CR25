import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { getListings } from '../../services/listings';
import './listing.css';

const Listing = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [allListings, setAllListings] = useState([]);
    const [filteredListings, setFilteredListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        category: '',
        minPrice: '',
        maxPrice: '',
        condition: '',
        university: '',
        pricingType: '',
        visibility: '',
        searchQuery: ''
    });

    useEffect(() => {
        const fetchListings = async () => {
            try {
                setLoading(true);
                setError('');
                const { listings } = await getListings();
                setAllListings(listings);
                setFilteredListings(listings);
            } catch (error) {
                console.error('Error fetching listings:', error);
                setError('Failed to load listings. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchListings();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const applyFilters = () => {
        let filtered = [...allListings];

        // Apply search filter
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(listing => 
                listing.title.toLowerCase().includes(query) ||
                listing.description.toLowerCase().includes(query)
            );
        }

        // Apply category filter
        if (filters.category) {
            filtered = filtered.filter(listing => listing.category === filters.category);
        }

        // Apply condition filter
        if (filters.condition) {
            filtered = filtered.filter(listing => listing.condition === filters.condition);
        }

        // Apply pricing type filter
        if (filters.pricingType) {
            filtered = filtered.filter(listing => listing.pricingType === filters.pricingType);
        }

        // Apply visibility filter
        if (filters.visibility) {
            filtered = filtered.filter(listing => listing.visibility === filters.visibility);
        }

        // Apply price range filter
        const minPrice = filters.minPrice ? Number(filters.minPrice) : 0;
        const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : Infinity;
        
        filtered = filtered.filter(listing => {
            if (listing.pricingType !== 'fixed') return true;
            const price = listing.price;
            return price >= minPrice && price <= maxPrice;
        });

        setFilteredListings(filtered);
    };

    const clearFilters = () => {
        const emptyFilters = {
            category: '',
            minPrice: '',
            maxPrice: '',
            condition: '',
            university: '',
            pricingType: '',
            visibility: '',
            searchQuery: ''
        };
        setFilters(emptyFilters);
        setFilteredListings(allListings);
    };

    if (loading) {
        return <div className="loading">Loading listings...</div>;
    }

    return (
        <div className="listings-container">
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
                            placeholder="Search listings..."
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
                            <option value="Textbooks">Textbooks</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Furniture">Furniture</option>
                            <option value="Clothing">Clothing</option>
                            <option value="Sports Equipment">Sports Equipment</option>
                            <option value="Musical Instruments">Musical Instruments</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="priceRange">Price Range</label>
                        <div className="price-range-inputs">
                            <input
                                type="number"
                                id="minPrice"
                                name="minPrice"
                                value={filters.minPrice}
                                onChange={handleFilterChange}
                                placeholder="Min Price"
                                min="0"
                            />
                            <span className="price-separator">-</span>
                            <input
                                type="number"
                                id="maxPrice"
                                name="maxPrice"
                                value={filters.maxPrice}
                                onChange={handleFilterChange}
                                placeholder="Max Price"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="condition">Condition</label>
                        <select
                            id="condition"
                            name="condition"
                            value={filters.condition}
                            onChange={handleFilterChange}
                        >
                            <option value="">Any Condition</option>
                            <option value="new">New</option>
                            <option value="like-new">Like New</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="pricingType">Pricing Type</label>
                        <select
                            id="pricingType"
                            name="pricingType"
                            value={filters.pricingType}
                            onChange={handleFilterChange}
                        >
                            <option value="">Any Pricing Type</option>
                            <option value="fixed">Fixed Price</option>
                            <option value="bidding">Open to Bids</option>
                            <option value="negotiable">Negotiable</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="visibility">Visibility</label>
                        <select
                            id="visibility"
                            name="visibility"
                            value={filters.visibility}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Listings</option>
                            <option value="university">My University Only</option>
                            <option value="all">All Universities</option>
                        </select>
                    </div>

                    <button type="submit" className="apply-filters-button">
                        Apply Filters
                    </button>
                </form>
            </div>

            <div className="listings-content">
                <div className="listings-header">
                    <h1>Discover Listings</h1>
                    <button
                        className="sell-button"
                        onClick={() => navigate('/sell')}
                    >
                        Create New Listing
                    </button>
                </div>

                <div className="listings-grid">
                    {error ? (
                        <div className="error-message">{error}</div>
                    ) : filteredListings.length === 0 ? (
                        <div className="no-listings">No listings found matching your criteria</div>
                    ) : (
                        filteredListings.map(listing => (
                            <div key={listing.id} className="listing-card" onClick={() => navigate(`/listing/${listing.id}`)}>
                                <div className="listing-image">
                                    <img src={listing.images[0]} alt={listing.title} />
                                </div>
                                <div className="listing-details">
                                    <h3>{listing.title}</h3>
                                    {listing.pricingType === 'fixed' && (
                                        <p className="price">৳{listing.price.toLocaleString()}</p>
                                    )}
                                    {listing.pricingType === 'bidding' && (
                                        <p className="price">Open to Bids</p>
                                    )}
                                    {listing.pricingType === 'negotiable' && (
                                        <p className="price">Price Negotiable</p>
                                    )}
                                    <p className="condition">{listing.condition}</p>
                                    <p className="university">{listing.university}</p>
                                    <div className="seller-info">
                                        <span>{listing.sellerName}</span>
                                        <span className="rating">★ {listing.sellerRating || 'New'}</span>
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

export default Listing;