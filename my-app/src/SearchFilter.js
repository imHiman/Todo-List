import React from 'react';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const SearchFilter = ({ 
  searchTerm, 
  setSearchTerm, 
  filterPriority, 
  setFilterPriority,
  filterStatus,
  setFilterStatus,
  showFilters,
  setShowFilters,
  PRIORITY_OPTIONS
}) => {
  return (
    <div className="search-filter-container">
      <div className="search-bar">
        <MagnifyingGlassIcon style={{ width: '20px', height: '20px' }} className="search-icon" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search tasks..."
          className="search-input"
        />
        {searchTerm && (
          <button
            className="clear-search"
            onClick={() => setSearchTerm('')}
          >
            <XMarkIcon style={{ width: '16px', height: '16px' }} />
          </button>
        )}
        <button
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <AdjustmentsHorizontalIcon style={{ width: '20px', height: '20px' }} />
        </button>
      </div>

      {showFilters && (
          <motion.div 
            className="filters-panel"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="filter-group">
            <label>Priority:</label>
            <select 
              value={filterPriority} 
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              {PRIORITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.icon} {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Tasks</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SearchFilter;