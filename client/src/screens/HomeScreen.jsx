import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/layout/Header';
import SearchBar from '../components/common/SearchBar';
import StatusTabs from '../components/common/StatusTabs';
import CategoryChips from '../components/common/CategoryChips';
import EventGrid from '../components/events/EventGrid';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { api } from '../services/api';
import { Sparkles } from 'lucide-react';

export const HomeScreen = ({ onNavigateToEvent, onOpenNotifications }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getEvents({
        category: activeCategory,
        status: activeStatus,
        search: searchQuery,
      });
      setEvents(res.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError(err.message || 'Could not fetch campus events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search/filter fetch slightly
    const timer = setTimeout(() => {
      fetchEvents();
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, activeStatus, activeCategory]);

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky App Header */}
      <Header onOpenNotifications={onOpenNotifications} />

      <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-4 flex-1">
        {/* Real-time Search */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search events, clubs, venues, or tags..."
        />

        {/* Status Filters */}
        <StatusTabs
          activeStatus={activeStatus}
          onSelectStatus={setActiveStatus}
        />

        {/* Category Filters */}
        <CategoryChips
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />

        {/* Main Feed Section Title */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-black font-heading text-slate-900 tracking-tight">
              Campus Feed
            </h2>
            <span className="text-[11px] text-slate-400 font-bold">
              ({events.length})
            </span>
          </div>

          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            Mixed Categories
          </span>
        </div>

        {/* Content States */}
        {loading ? (
          <LoadingSkeleton type="cards" count={8} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchEvents} />
        ) : events.length === 0 ? (
          <EmptyState
            title="No events match your criteria"
            description="Try switching status tabs, resetting category chips, or searching with another keyword."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setActiveStatus('all');
              setActiveCategory('All');
            }}
          />
        ) : (
          <EventGrid
            events={events}
            onSelectEvent={onNavigateToEvent}
          />
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
