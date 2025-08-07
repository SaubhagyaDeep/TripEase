import { Router } from 'express';

interface Trip {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  events: string[];
}

let trips: Trip[] = [];
let nextId = 1;

const router = Router();

// Helper function to calculate trip duration in days
function calculateTripDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  // Return at least 1 day for same-day trips
  return Math.max(1, diffDays);
}

// Helper function to count days in events array
function countDaysInEvents(events: string[]): number {
  return events.filter(event => event.startsWith('DAY')).length;
}

// Create a trip
router.post('/', (req, res) => {
  console.log('Creating trip:', req.body);
  const { name, startDate, endDate } = req.body;
  
  if (!name || !startDate || !endDate) {
    console.log('Missing fields:', { name, startDate, endDate });
    return res.status(400).json({ error: 'Missing required fields: name, startDate, endDate' });
  }
  
  // Validate that end date is not before start date
  const tripDuration = calculateTripDuration(startDate, endDate);
  if (tripDuration < 0) {
    console.log('Invalid date range:', { startDate, endDate, tripDuration });
    return res.status(400).json({ error: 'End date cannot be before start date' });
  }
  
  const trip: Trip = { id: nextId++, name, startDate, endDate, events: [] };
  trips.push(trip);
  console.log('Trip created:', trip);
  res.status(201).json(trip);
});

// Read all trips
router.get('/', (req, res) => {
  console.log('Fetching all trips, count:', trips.length);
  res.json(trips);
});

// Read one trip
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  console.log('Fetching trip with id:', id);
  
  const trip = trips.find(t => t.id === id);
  if (!trip) {
    console.log('Trip not found with id:', id);
    return res.status(404).json({ error: 'Trip not found' });
  }
  
  console.log('Trip found:', trip);
  res.json(trip);
});

// Update a trip (including events)
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, startDate, endDate, events } = req.body;
  
  console.log('Updating trip:', { id, name, startDate, endDate, eventsCount: events?.length });
  
  const trip = trips.find(t => t.id === id);
  if (!trip) {
    console.log('Trip not found for update, id:', id);
    return res.status(404).json({ error: 'Trip not found' });
  }
  
  // Validate date range if dates are being updated
  if (startDate !== undefined || endDate !== undefined) {
    const newStartDate = startDate !== undefined ? startDate : trip.startDate;
    const newEndDate = endDate !== undefined ? endDate : trip.endDate;
    
    const tripDuration = calculateTripDuration(newStartDate, newEndDate);
    if (tripDuration < 0) {
      console.log('Invalid date range:', { newStartDate, newEndDate, tripDuration });
      return res.status(400).json({ error: 'End date cannot be before start date' });
    }
  }
  
  // Update basic fields if provided
  if (name !== undefined) trip.name = name;
  if (startDate !== undefined) trip.startDate = startDate;
  if (endDate !== undefined) trip.endDate = endDate;
  
  // Update events array if provided
  if (events !== undefined) {
    if (Array.isArray(events)) {
      // Validate that number of days doesn't exceed trip duration
      const daysInEvents = countDaysInEvents(events);
      const tripDuration = calculateTripDuration(trip.startDate, trip.endDate);
      
      if (daysInEvents > tripDuration) {
        console.log('Too many days in events:', { daysInEvents, tripDuration });
        return res.status(400).json({ 
          error: `Cannot add more than ${tripDuration} days to this trip (trip duration: ${tripDuration} days)` 
        });
      }
      
      trip.events = events;
      console.log('Events updated, new count:', trip.events.length, 'days:', daysInEvents);
    } else {
      console.log('Invalid events format, expected array but got:', typeof events);
      return res.status(400).json({ error: 'Events must be an array' });
    }
  }
  
  console.log('Trip updated successfully:', trip);
  res.json(trip);
});

// Delete a trip
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  console.log('Deleting trip with id:', id);
  
  const index = trips.findIndex(t => t.id === id);
  if (index === -1) {
    console.log('Trip not found for deletion, id:', id);
    return res.status(404).json({ error: 'Trip not found' });
  }
  
  const deletedTrip = trips.splice(index, 1)[0];
  console.log('Trip deleted:', deletedTrip);
  res.status(204).send();
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    tripsCount: trips.length,
    timestamp: new Date().toISOString()
  });
});

export default router;