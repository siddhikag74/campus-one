import React from 'react';
import EventCard from './EventCard';

export const EventGrid = ({ events = [], onSelectEvent }) => {
  if (!events.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
      {events.map((event) => (
        <EventCard
          key={event._id}
          event={event}
          onSelect={onSelectEvent}
        />
      ))}
    </div>
  );
};

export default EventGrid;
