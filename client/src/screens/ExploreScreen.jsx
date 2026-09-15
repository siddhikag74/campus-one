import React, { useState, useEffect } from 'react';
import SearchBar from '../components/common/SearchBar';
import CategoryChips from '../components/common/CategoryChips';
import EventCard from '../components/events/EventCard';
import EventGrid from '../components/events/EventGrid';
import ClubCard from '../components/clubs/ClubCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { api } from '../services/api';
import { Sparkles, Flame, Users, Compass } from 'lucide-react';

export const ExploreScreen = ({ onNavigateToEvent, onNavigateToClub }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const [allEvents, setAllEvents] = useState([]);
  const [allClubs, setAllClubs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExploreData = async () => {
      try {
        setLoading(true);
        const [eventsRes, clubsRes, recoRes] = await Promise.all([
          api.getEvents(),
          api.getClubs(),
          api.getRecommendations().catch(() => ({ recommendations: [] })),
        ]);

        setAllEvents(eventsRes.events || []);
        setAllClubs(clubsRes.clubs || []);
        setRecommendations(recoRes.recommendations || []);
      } catch (err) {
        console.error('Error loading explore data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadExploreData();
  }, []);

  const isSearching = searchQuery.trim().length > 0;

  // Real-time search filtered lists
  const searchFilter = (term) => {
    const q = term.toLowerCase().trim();
    const filteredEvents = allEvents.filter(
      (e) =>
        e.title?.toLowerCase().includes(q) ||
        e.club?.name?.toLowerCase().includes(q) ||
        e.venue?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q) ||
        (e.tags || []).some((t) => t.toLowerCase().includes(q))
    );

    const filteredClubs = allClubs.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );

    return { filteredEvents, filteredClubs };
  };

  const { filteredEvents, filteredClubs } = isSearching
    ? searchFilter(searchQuery)
    : { filteredEvents: [], filteredClubs: [] };

  const totalResults = filteredEvents.length + filteredClubs.length;

  // Featured events: filtered by popular flag
  const featuredEvents = allEvents.filter((e) => e.isPopular && e.status !== 'missed');

  // Filtered by Category Chip (when not searching)
  const categoryFilteredEvents =
    activeCategory === 'All'
      ? allEvents
      : allEvents.filter((e) => e.category === activeCategory);

  return (
    <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-5 min-h-full pb-12">
      {/* Title & Real-time Search */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Compass className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-heading font-black text-slate-900 tracking-tight">
            Explore Campus
          </h1>
        </div>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search activities, clubs, societies, tags..."
        />
      </div>

      {/* SEARCHING STATE */}
      {isSearching ? (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-700 font-heading">
              Search Results
            </span>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {totalResults} found
            </span>
          </div>

          {totalResults === 0 ? (
            <EmptyState
              title="No results found"
              description={`We couldn't find any events or clubs matching "${searchQuery}".`}
              actionLabel="Clear Search"
              onAction={() => setSearchQuery('')}
            />
          ) : (
            <>
              {/* Matching Events & Activities */}
              {filteredEvents.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Events & Activities ({filteredEvents.length})
                  </h3>
                  <EventGrid events={filteredEvents} onSelectEvent={onNavigateToEvent} />
                </div>
              )}

              {/* Matching Clubs & Societies */}
              {filteredClubs.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Clubs & Societies ({filteredClubs.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredClubs.map((club) => (
                      <ClubCard
                        key={club._id}
                        club={club}
                        onSelect={onNavigateToClub}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* DEFAULT (NOT SEARCHING) STATE */
        <div className="space-y-6 animate-fade-in">
          {/* Category Chips */}
          <CategoryChips
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
          />

          {/* 1. Featured (Horizontal Scroll of Popular Events) */}
          {featuredEvents.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-heading">
                    Featured & Popular
                  </h2>
                </div>
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  Trending 🔥
                </span>
              </div>

              {/* Horizontal Scroll Carousel */}
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 -mx-4 sm:mx-0 px-4 sm:px-0 snap-x">
                {featuredEvents.map((event) => (
                  <div key={event._id} className="min-w-[210px] max-w-[210px] md:min-w-[240px] md:max-w-[240px] snap-start shrink-0">
                    <EventCard
                      event={event}
                      onSelect={onNavigateToEvent}
                      compact
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2. Recommended For You (AI/ML Engine Grid with reasons & match scores) */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-heading">
                  Recommended for You
                </h2>
              </div>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                AI Engine
              </span>
            </div>

            {loading ? (
              <LoadingSkeleton type="cards" count={4} />
            ) : recommendations.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                {recommendations.slice(0, 4).map((item) => (
                  <div key={item.event._id} className="flex flex-col justify-between">
                    <EventCard
                      event={item.event}
                      onSelect={onNavigateToEvent}
                    />
                    {/* AI Match Reason Banner */}
                    <div className="mt-1.5 px-2 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[9px] font-bold text-primary flex items-center justify-between">
                      <span className="truncate">{item.matchReason}</span>
                      <span className="shrink-0 font-extrabold">{item.relevanceScore}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EventGrid
                events={categoryFilteredEvents.slice(0, 4)}
                onSelectEvent={onNavigateToEvent}
              />
            )}
          </section>

          {/* 3. Clubs & Societies Section */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-heading">
                  Clubs & Societies
                </h2>
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                {allClubs.length} Active
              </span>
            </div>

            {loading ? (
              <LoadingSkeleton type="list" count={3} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allClubs.slice(0, 6).map((club) => (
                  <ClubCard
                    key={club._id}
                    club={club}
                    onSelect={onNavigateToClub}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default ExploreScreen;
