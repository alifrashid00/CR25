import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getListings } from '../../services/listings';
import Chatbot from '../../components/Chatbot';
import './listing.css';

const Listing = () => {
    const navigate = useNavigate();
    const [allListings, setAllListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
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
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [suggestedItems, setSuggestedItems] = useState([]);

    // Memoize filtered listings to avoid recalculation
    const filteredListings = useMemo(() => {
        return allListings.filter(listing => {
            // Apply search filter
            if (filters.searchQuery) {
                const searchLower = filters.searchQuery.toLowerCase();
                if (!listing.title.toLowerCase().includes(searchLower) && 
                    !listing.description.toLowerCase().includes(searchLower)) {
                    return false;
                }
            }
            
            // Apply category filter
            if (filters.category && listing.category !== filters.category) {
                return false;
            }
            
            // Apply condition filter
            if (filters.condition && listing.condition !== filters.condition) {
                return false;
            }
            
            // Apply university filter
            if (filters.university && listing.university !== filters.university) {
                return false;
            }
            
            // Apply pricing type filter
            if (filters.pricingType && listing.pricingType !== filters.pricingType) {
                return false;
            }
            
            // Apply price range filter
            if (filters.minPrice && listing.price < parseFloat(filters.minPrice)) {
                return false;
            }
            if (filters.maxPrice && listing.price > parseFloat(filters.maxPrice)) {
                return false;
            }
            
            return true;
        });
    }, [allListings, filters]);

    const fetchInitialListings = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const { listings, lastDoc: newLastDoc, hasMore: moreAvailable } = await getListings({}, null);
            setAllListings(listings);
            setLastDoc(newLastDoc);
            setHasMore(moreAvailable);
        } catch (error) {
            console.error('Error fetching listings:', error);
            setError('Failed to load listings. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadMoreListings = useCallback(async () => {
        if (!hasMore || loadingMore) return;
        
        try {
            setLoadingMore(true);
            const { listings, lastDoc: newLastDoc, hasMore: moreAvailable } = await getListings({}, lastDoc);
            setAllListings(prev => [...prev, ...listings]);
            setLastDoc(newLastDoc);
            setHasMore(moreAvailable);
        } catch (error) {
            console.error('Error loading more listings:', error);
        } finally {
            setLoadingMore(false);
        }
    }, [lastDoc, hasMore, loadingMore]);

    useEffect(() => {
        fetchInitialListings();
    }, [fetchInitialListings]);

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

    const handleChatbotFilters = (chatbotFilters) => {
        const updatedFilters = { ...filters, ...chatbotFilters };
        setFilters(updatedFilters);
        
        // Apply the filters immediately
        let filtered = [...allListings];

        // Apply search filter
        if (updatedFilters.searchQuery) {
            const query = updatedFilters.searchQuery.toLowerCase();
            filtered = filtered.filter(listing => 
                listing.title.toLowerCase().includes(query) ||
                listing.description.toLowerCase().includes(query)
            );
        }

        // Apply category filter
        if (updatedFilters.category) {
            filtered = filtered.filter(listing => listing.category === updatedFilters.category);
        }

        // Apply condition filter
        if (updatedFilters.condition) {
            filtered = filtered.filter(listing => listing.condition === updatedFilters.condition);
        }

        // Apply pricing type filter
        if (updatedFilters.pricingType) {
            filtered = filtered.filter(listing => listing.pricingType === updatedFilters.pricingType);
        }

        // Apply visibility filter
        if (updatedFilters.visibility) {
            filtered = filtered.filter(listing => listing.visibility === updatedFilters.visibility);
        }

        // Apply price range filter
        const minPrice = updatedFilters.minPrice ? Number(updatedFilters.minPrice) : 0;
        const maxPrice = updatedFilters.maxPrice ? Number(updatedFilters.maxPrice) : Infinity;
        
        filtered = filtered.filter(listing => {
            if (listing.pricingType !== 'fixed') return true;
            const price = listing.price;
            return price >= minPrice && price <= maxPrice;
        });

        setFilteredListings(filtered);
    };

    const handleSuggestionsUpdate = (suggestions) => {
        setSuggestedItems(suggestions);
        
        // If suggestions are provided, filter listings to show only suggested items
        if (suggestions && suggestions.length > 0) {
            const suggestedListings = allListings.filter(listing => 
                suggestions.includes(listing.id) || 
                suggestions.includes(listing.title) ||
                suggestions.some(suggestion => 
                    listing.title.toLowerCase().includes(suggestion.toLowerCase()) ||
                    listing.description?.toLowerCase().includes(suggestion.toLowerCase())
                )
            );
            
            // If we found suggested listings, show them; otherwise show current filtered results
            if (suggestedListings.length > 0) {
                setFilteredListings(suggestedListings);
            }
        }
    };

    const clearSuggestions = () => {
        setSuggestedItems([]);
        // Apply current filters to show all relevant listings
        applyFilters();
    };

    if (loading) {
        return <div className="loading">Loading listings...</div>;
    }

    return (
        <div className="listings-container">
            <div className="listings-content">
                <div className="listings-header">
                    <h1>Discover Listings</h1>
                    <div className="header-buttons">
                        {suggestedItems.length > 0 && (
                            <button
                                className="show-all-button"
                                onClick={clearSuggestions}
                            >
                                Show All Listings
                            </button>
                        )}
                        <button 
                            className="filter-button"
                            onClick={() => setShowFilterModal(true)}
                        >
                            Filter
                        </button>
                        <button
                            className="sell-button"
                            onClick={() => navigate('/sell')}
                        >
                            Create New Listing
                        </button>
                    </div>
                </div>

                {suggestedItems.length > 0 && (
                    <div className="suggestions-info">
                        <span className="suggestions-icon">🤖</span>
                        Showing AI suggested items ({filteredListings.length} found)
                    </div>
                )}

                <div className="listings-grid">
                    {error ? (
                        <div className="error-message">{error}</div>
                    ) : filteredListings.length === 0 ? (
                        <div className="no-listings">No listings found matching your criteria</div>
                    ) : (
                        filteredListings.map(listing => {
                            const isSuggested = suggestedItems.includes(listing.id) || suggestedItems.includes(listing.title);
                            return (
                                <div 
                                    key={listing.id} 
                                    className={`listing-card ${isSuggested ? 'suggested' : ''}`} 
                                    onClick={() => navigate(`/listing/${listing.id}`)}
                                >
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
                            );
                        })
                    )}
                </div>
            </div>
            
            {showFilterModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Filters</h2>
                            <button 
                                className="close-button"
                                onClick={() => setShowFilterModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="filters-section">
                            <div className="filters-header">
                                <button className="clear-filters" onClick={clearFilters}>
                                    Clear All
                                </button>
                            </div>
                            <form className="filters-form" onSubmit={(e) => { e.preventDefault(); applyFilters(); setShowFilterModal(false); }}>
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
                                        <option value="">All Conditions</option>
                                        <option value="New">New</option>
                                        <option value="Like New">Like New</option>
                                        <option value="Good">Good</option>
                                        <option value="Fair">Fair</option>
                                        <option value="Poor">Poor</option>
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
                                        <option value="">All Pricing Types</option>
                                        <option value="fixed">Fixed Price</option>
                                        <option value="negotiable">Negotiable</option>
                                        <option value="auction">Auction</option>
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
                                        <option value="">All Visibility</option>
                                        <option value="public">Public</option>
                                        <option value="university">University Only</option>
                                    </select>
                                </div>

                                <button type="submit" className="apply-filters">
                                    Apply Filters
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <Chatbot
                onFiltersUpdate={handleChatbotFilters}
                isOpen={isChatbotOpen}
                onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
                availableListings={allListings}
                onSuggestionsUpdate={handleSuggestionsUpdate}
            />
        </div>
    );
};

export default Listing;