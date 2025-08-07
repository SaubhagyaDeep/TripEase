<template>
  <div>
    <div class="card">
      <h2>{{ editingTrip ? 'Edit Trip' : 'Add a New Trip' }}</h2>
      <form @submit.prevent="editingTrip ? updateTrip() : addTrip()">
        <label for="name">Trip Name</label>
        <input id="name" v-model="form.name" required placeholder="e.g. Sri Lanka Adventure" />

        <label for="start">Start Date (dd/mm/yyyy)</label>
        <input id="start" type="text" v-model="form.startDate" required placeholder="05/08/2025" />

        <label for="end">End Date (dd/mm/yyyy)</label>
        <input id="end" type="text" v-model="form.endDate" required placeholder="14/08/2025" />

        <div class="flex">
          <button class="button" type="submit">{{ editingTrip ? 'Update' : 'Add' }}</button>
          <button v-if="editingTrip" class="button" type="button" @click="cancelEdit">Cancel</button>
        </div>
      </form>
    </div>

    <div v-if="trips.length" class="card">
      <h2>Your Trips</h2>
      <div v-for="trip in trips" :key="trip.id" class="trip-container">
        <div class="trip-header">
          <h3>{{ trip.name }}</h3>
          <div class="trip-dates">{{ formatDateForDisplay(trip.startDate) }} → {{ formatDateForDisplay(trip.endDate) }}</div>
          <div class="trip-actions">
            <button class="button" @click="editTrip(trip)">Edit</button>
            <button class="button danger" @click="deleteTrip(trip.id)">Delete</button>
          </div>
        </div>

        <!-- Itinerary Table -->
        <div class="itinerary-container">
          <div class="itinerary-header">
            <h4>Itinerary</h4>
            <button class="button" @click="addDay(trip.id)">Add Day</button>
          </div>
          
          <div v-if="trip.events && trip.events.length" class="itinerary-table">
            <div v-for="(day, dayIndex) in parseItinerary(trip.events)" :key="dayIndex" class="day-section">
              <div class="day-header">
                <h5>Day {{ dayIndex + 1 }}</h5>
                <button class="button danger small" @click="deleteDay(trip.id, dayIndex)">Delete Day</button>
              </div>
              
              <div class="table-container">
                <table class="itinerary-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Activity</th>
                      <th>Time</th>
                      <th>Maps / Links</th>
                      <th>Ticket / Image</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(activity, activityIndex) in day.activities" :key="activityIndex">
                      <td>{{ activityIndex + 1 }}</td>
                      <td class="scrollable-cell">{{ activity.place }}</td>
                      <td class="scrollable-cell">{{ activity.time || 'N/A' }}</td>
                      <td class="scrollable-cell">
                        <span v-if="activity.mapLocation && activity.mapLocation.startsWith('http')">
                          <a :href="activity.mapLocation" target="_blank" rel="noopener noreferrer">{{ activity.mapLocation }}</a>
                        </span>
                        <span v-else>{{ activity.mapLocation || 'N/A' }}</span>
                      </td>
                      <td class="scrollable-cell">
                        <span v-if="activity.link && activity.link.startsWith('http')">
                          <a :href="activity.link" target="_blank" rel="noopener noreferrer">{{ activity.link }}</a>
                        </span>
                        <span v-else-if="activity.link && activity.link.startsWith('data:image')">
                          <img :src="activity.link" alt="Uploaded image" class="activity-image" />
                          <button class="button small" @click="removeImage(trip.id, dayIndex, activityIndex)">Remove</button>
                        </span>
                        <span v-else>{{ activity.link || 'N/A' }}</span>
                      </td>
                      <td>
                        <button class="button small" @click="editActivity(trip.id, dayIndex, activityIndex, activity)">Edit</button>
                        <button class="button small danger" @click="deleteActivity(trip.id, dayIndex, activityIndex)">Delete</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Edit Activity Form -->
              <div v-if="editingActivity && editingActivity.tripId === trip.id && editingActivity.dayIndex === dayIndex" class="edit-activity-form">
                <h6>Edit Activity in Day {{ dayIndex + 1 }}</h6>
                <div class="form-grid">
                  <input v-model="newActivity[trip.id][dayIndex].place" placeholder="Activity *" required />
                  <input v-model="newActivity[trip.id][dayIndex].time" placeholder="Time (e.g., 10am-11am)" />
                  <input v-model="newActivity[trip.id][dayIndex].mapLocation" placeholder="Maps / Links" />
                  <div class="ticket-image-section">
                    <div v-if="newActivity[trip.id][dayIndex].link" class="current-content">
                      <span v-if="newActivity[trip.id][dayIndex].link.startsWith('http')" class="link-display">
                        <a :href="newActivity[trip.id][dayIndex].link" target="_blank" rel="noopener noreferrer">{{ newActivity[trip.id][dayIndex].link }}</a>
                      </span>
                      <span v-else-if="newActivity[trip.id][dayIndex].link.startsWith('data:image')" class="image-display">
                        <img :src="newActivity[trip.id][dayIndex].link" alt="Uploaded image" class="preview-image" />
                      </span>
                      <span v-else class="text-display">{{ newActivity[trip.id][dayIndex].link }}</span>
                      <button type="button" class="button small danger" @click="clearTicketImage(trip.id, dayIndex)">Clear</button>
                    </div>
                    <div v-else class="upload-section">
                      <input 
                        type="file" 
                        :id="`upload-edit-${trip.id}-${dayIndex}`" 
                        accept="image/*" 
                        @change="handleImageUpload($event, trip.id, dayIndex)"
                        style="display: none;"
                      />
                      <button type="button" class="button" @click="triggerFileUpload(`upload-edit-${trip.id}-${dayIndex}`)">
                        📷 Upload Image
                      </button>
                      <input 
                        v-model="newActivity[trip.id][dayIndex].link" 
                        placeholder="Or enter link manually" 
                        class="manual-link-input"
                      />
                    </div>
                  </div>
                  <button class="button" @click="updateActivity(trip.id, dayIndex)">Update</button>
                  <button class="button" @click="cancelEditActivity">Cancel</button>
                </div>
              </div>
              
              <!-- Add Activity Form -->
              <div v-if="!editingActivity || editingActivity.tripId !== trip.id || editingActivity.dayIndex !== dayIndex" class="add-activity-form">
                <h6>Add Activity to Day {{ dayIndex + 1 }}</h6>
                <div class="form-grid">
                  <input v-model="newActivity[trip.id][dayIndex].place" placeholder="Place *" required />
                  <input v-model="newActivity[trip.id][dayIndex].time" placeholder="Time (e.g., 10am-11am)" />
                  <input v-model="newActivity[trip.id][dayIndex].mapLocation" placeholder="Maps / Links" />
                  <div class="ticket-image-section">
                    <div v-if="newActivity[trip.id][dayIndex].link" class="current-content">
                      <span v-if="newActivity[trip.id][dayIndex].link.startsWith('http')" class="link-display">
                        <a :href="newActivity[trip.id][dayIndex].link" target="_blank" rel="noopener noreferrer">{{ newActivity[trip.id][dayIndex].link }}</a>
                      </span>
                      <span v-else-if="newActivity[trip.id][dayIndex].link.startsWith('data:image')" class="image-display">
                        <img :src="newActivity[trip.id][dayIndex].link" alt="Uploaded image" class="preview-image" />
                      </span>
                      <span v-else class="text-display">{{ newActivity[trip.id][dayIndex].link }}</span>
                      <button type="button" class="button small danger" @click="clearTicketImage(trip.id, dayIndex)">Clear</button>
                    </div>
                    <div v-else class="upload-section">
                      <input 
                        type="file" 
                        :id="`upload-add-${trip.id}-${dayIndex}`" 
                        accept="image/*" 
                        @change="handleImageUpload($event, trip.id, dayIndex)"
                        style="display: none;"
                      />
                      <button type="button" class="button" @click="triggerFileUpload(`upload-add-${trip.id}-${dayIndex}`)">
                        📷 Upload Image
                      </button>
                      <input 
                        v-model="newActivity[trip.id][dayIndex].link" 
                        placeholder="Or enter link manually" 
                        class="manual-link-input"
                      />
                    </div>
                  </div>
                  <button class="button" @click="addActivity(trip.id, dayIndex)">Add Activity</button>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="no-itinerary">
            <p>No itinerary yet. Add your first day!</p>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="card" style="text-align:center;">
      <p>No trips yet. Add your first adventure!</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';

interface Trip {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  events: string[];
}

interface Activity {
  place: string;
  time: string;
  mapLocation: string;
  link: string;
}

interface Day {
  activities: Activity[];
}

const trips = ref<Trip[]>([]);
const form = ref({ name: '', startDate: '', endDate: '' });
const editingTrip = ref<Trip | null>(null);
const editingActivity = ref<{ tripId: number; dayIndex: number; activityIndex: number } | null>(null);
const newActivity = ref<Record<number, Record<number, Activity>>>({});

const API = 'http://localhost:3001/trips';

// Helper function to format date to dd/mm/yyyy
function formatDateForDisplay(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Helper function to convert dd/mm/yyyy to yyyy-mm-dd for input
function formatDateForInput(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateString;
}

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

// Initialize newActivity object for a trip and its days
function initializeNewActivity(tripId: number, daysCount: number) {
  if (!newActivity.value[tripId]) {
    newActivity.value[tripId] = {};
  }
  for (let i = 0; i < daysCount; i++) {
    if (!newActivity.value[tripId][i]) {
      newActivity.value[tripId][i] = { place: '', time: '', mapLocation: '', link: '' };
    }
  }
}

// Parse events string into structured itinerary
function parseItinerary(events: string[]): Day[] {
  const days: Day[] = [];
  let currentDay: Activity[] = [];
  let dayStarted = false;
  
  events.forEach(event => {
    if (event.startsWith('DAY')) {
      // If we have a previous day with activities, save it
      if (dayStarted && currentDay.length > 0) {
        days.push({ activities: currentDay });
        currentDay = [];
      }
      // If we have a previous day with no activities, still save it
      else if (dayStarted) {
        days.push({ activities: [] });
      }
      dayStarted = true;
    } else {
      // Parse activity format: "place|time|mapLocation|link"
      const parts = event.split('|');
      if (parts.length >= 4) {
        currentDay.push({
          place: parts[0],
          time: parts[1],
          mapLocation: parts[2],
          link: parts[3]
        });
      }
    }
  });
  
  // Don't forget the last day
  if (dayStarted) {
    days.push({ activities: currentDay });
  }
  
  return days;
}

// Convert structured itinerary back to events array
function itineraryToEvents(itinerary: Day[]): string[] {
  const events: string[] = [];
  itinerary.forEach((day, dayIndex) => {
    events.push(`DAY${dayIndex + 1}`);
    day.activities.forEach(activity => {
      events.push(`${activity.place}|${activity.time}|${activity.mapLocation}|${activity.link}`);
    });
  });
  return events;
}

async function fetchTrips() {
  const res = await fetch(API);
  trips.value = await res.json();
  trips.value.forEach(trip => {
    initializeNewActivity(trip.id, trip.events.filter(e => e.startsWith('DAY')).length);
  });
}

async function addTrip() {
  // Validate date range
  const startDateFormatted = formatDateForInput(form.value.startDate);
  const endDateFormatted = formatDateForInput(form.value.endDate);
  
  const tripDuration = calculateTripDuration(startDateFormatted, endDateFormatted);
  if (tripDuration < 0) {
    alert('End date cannot be before start date');
    return;
  }
  
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: form.value.name,
      startDate: startDateFormatted,
      endDate: endDateFormatted
    })
  });
  
  if (res.ok) {
    await fetchTrips();
    form.value = { name: '', startDate: '', endDate: '' };
  } else {
    const errorData = await res.json();
    alert(`Error creating trip: ${errorData.error}`);
  }
}

function editTrip(trip: Trip) {
  editingTrip.value = { ...trip };
  form.value = { 
    name: trip.name, 
    startDate: formatDateForDisplay(trip.startDate), 
    endDate: formatDateForDisplay(trip.endDate) 
  };
}

async function updateTrip() {
  if (!editingTrip.value) return;
  
  // Validate date range if dates are being changed
  const startDateFormatted = formatDateForInput(form.value.startDate);
  const endDateFormatted = formatDateForInput(form.value.endDate);
  
  const tripDuration = calculateTripDuration(startDateFormatted, endDateFormatted);
  if (tripDuration < 0) {
    alert('End date cannot be before start date');
    return;
  }
  
  const res = await fetch(`${API}/${editingTrip.value.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: form.value.name,
      startDate: startDateFormatted,
      endDate: endDateFormatted
    })
  });
  
  if (res.ok) {
    await fetchTrips();
    cancelEdit();
  } else {
    const errorData = await res.json();
    alert(`Error updating trip: ${errorData.error}`);
  }
}

async function deleteTrip(id: number) {
  const trip = trips.value.find(t => t.id === id);
  if (!trip) return;
  
  const confirmed = confirm(`Are you sure you want to delete the trip "${trip.name}"? This will permanently remove the trip and all its itinerary.`);
  if (!confirmed) return;
  
  const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
  if (res.ok) await fetchTrips();
}

function cancelEdit() {
  editingTrip.value = null;
  form.value = { name: '', startDate: '', endDate: '' };
}

// Itinerary management
async function addDay(tripId: number) {
  console.log('addDay called with tripId:', tripId);
  const trip = trips.value.find(t => t.id === tripId);
  if (!trip) {
    console.log('Trip not found');
    return;
  }
  
  console.log('Current trip events:', trip.events);
  // Count existing days
  const existingDays = trip.events.filter(e => e.startsWith('DAY')).length;
  const newDayNumber = existingDays + 1;
  
  // Validate that adding this day won't exceed trip duration
  const tripDuration = calculateTripDuration(trip.startDate, trip.endDate);
  if (newDayNumber > tripDuration) {
    alert(`Cannot add more than ${tripDuration} days to this trip (trip duration: ${tripDuration} days)`);
    return;
  }
  
  const newEvents = [...trip.events, `DAY${newDayNumber}`];
  
  console.log('Adding new day:', `DAY${newDayNumber}`);
  console.log('New events array:', newEvents);
  
  // Initialize newActivity for the new day
  initializeNewActivity(tripId, newDayNumber);
  
  const res = await fetch(`${API}/${tripId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...trip, events: newEvents })
  });
  
  console.log('Response status:', res.status);
  if (res.ok) {
    console.log('Successfully added day');
    await fetchTrips();
  } else {
    console.log('Failed to add day');
    const errorText = await res.text();
    console.log('Error:', errorText);
    try {
      const errorData = JSON.parse(errorText);
      alert(`Error adding day: ${errorData.error}`);
    } catch {
      alert('Error adding day');
    }
  }
}

async function deleteDay(tripId: number, dayIndex: number) {
  const trip = trips.value.find(t => t.id === tripId);
  if (!trip) return;
  
  const confirmed = confirm(`Are you sure you want to delete Day ${dayIndex + 1} from "${trip.name}"? This will remove all activities for this day.`);
  if (!confirmed) return;
  
  const itinerary = parseItinerary(trip.events);
  itinerary.splice(dayIndex, 1);
  const newEvents = itineraryToEvents(itinerary);
  
  const res = await fetch(`${API}/${tripId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...trip, events: newEvents })
  });
  if (res.ok) await fetchTrips();
}

async function addActivity(tripId: number, dayIndex: number) {
  console.log('addActivity called:', { tripId, dayIndex });
  const activity = newActivity.value[tripId]?.[dayIndex];
  console.log('Activity data:', activity);
  
  if (!activity || !activity.place) {
    console.log('Activity validation failed:', { hasActivity: !!activity, hasPlace: !!activity?.place });
    return;
  }
  
  const trip = trips.value.find(t => t.id === tripId);
  if (!trip) {
    console.log('Trip not found');
    return;
  }
  
  console.log('Current trip events:', trip.events);
  const itinerary = parseItinerary(trip.events);
  console.log('Parsed itinerary:', itinerary);
  
  if (!itinerary[dayIndex]) {
    console.log('Day not found in itinerary');
    return;
  }
  
  console.log('Current activities in day:', itinerary[dayIndex].activities);
  itinerary[dayIndex].activities.push(activity);
  console.log('Activities after adding:', itinerary[dayIndex].activities);
  
  const newEvents = itineraryToEvents(itinerary);
  console.log('New events array:', newEvents);
  
  const res = await fetch(`${API}/${tripId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...trip, events: newEvents })
  });
  
  console.log('Response status:', res.status);
  if (res.ok) {
    console.log('Successfully added activity');
    await fetchTrips();
    // Clear the form
    if (newActivity.value[tripId]) {
      newActivity.value[tripId][dayIndex] = { place: '', time: '', mapLocation: '', link: '' };
    }
  } else {
    console.log('Failed to add activity');
    const errorText = await res.text();
    console.log('Error:', errorText);
  }
}

async function deleteActivity(tripId: number, dayIndex: number, activityIndex: number) {
  const trip = trips.value.find(t => t.id === tripId);
  if (!trip) return;
  
  const itinerary = parseItinerary(trip.events);
  const activity = itinerary[dayIndex]?.activities[activityIndex];
  if (!activity) return;
  
  const confirmed = confirm(`Are you sure you want to delete the activity "${activity.place}" from Day ${dayIndex + 1}?`);
  if (!confirmed) return;
  
  itinerary[dayIndex].activities.splice(activityIndex, 1);
  const newEvents = itineraryToEvents(itinerary);
  
  const res = await fetch(`${API}/${tripId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...trip, events: newEvents })
  });
  if (res.ok) await fetchTrips();
}

function editActivity(tripId: number, dayIndex: number, activityIndex: number, activity: Activity) {
  editingActivity.value = { tripId, dayIndex, activityIndex };
  newActivity.value[tripId][dayIndex] = { ...activity };
}

async function updateActivity(tripId: number, dayIndex: number) {
  if (!editingActivity.value) return;
  const activity = newActivity.value[tripId]?.[dayIndex];
  if (!activity || !activity.place) return;

  const trip = trips.value.find(t => t.id === tripId);
  if (!trip) return;

  const itinerary = parseItinerary(trip.events);
  if (!itinerary[dayIndex] || !itinerary[dayIndex].activities[editingActivity.value.activityIndex]) return;

  itinerary[dayIndex].activities[editingActivity.value.activityIndex] = activity;
  const newEvents = itineraryToEvents(itinerary);

  const res = await fetch(`${API}/${tripId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...trip, events: newEvents })
  });

  if (res.ok) {
    await fetchTrips();
    editingActivity.value = null;
  } else {
    const errorText = await res.text();
    console.log('Error:', errorText);
    try {
      const errorData = JSON.parse(errorText);
      alert(`Error updating activity: ${errorData.error}`);
    } catch {
      alert('Error updating activity');
    }
  }
}

function cancelEditActivity() {
  editingActivity.value = null;
}

// File upload handling
async function handleImageUpload(event: Event, tripId: number, dayIndex: number) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target?.result) {
      newActivity.value[tripId][dayIndex].link = e.target.result as string;
    }
  };
  reader.readAsDataURL(file);
}

function triggerFileUpload(inputId: string) {
  const input = document.getElementById(inputId) as HTMLInputElement;
  if (input) {
    input.click();
  }
}

async function removeImage(tripId: number, dayIndex: number, activityIndex: number) {
  const itinerary = parseItinerary(trips.value.find(t => t.id === tripId)?.events || []);
  const activity = itinerary[dayIndex]?.activities[activityIndex];
  if (!activity) return;

  const confirmed = confirm(`Are you sure you want to remove the image for "${activity.place}"?`);
  if (!confirmed) return;

  activity.link = ''; // Clear the link
  const newEvents = itineraryToEvents(itinerary);

  const res = await fetch(`${API}/${tripId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...trips.value.find(t => t.id === tripId), events: newEvents })
  });
  if (res.ok) await fetchTrips();
}

function clearTicketImage(tripId: number, dayIndex: number) {
  newActivity.value[tripId][dayIndex].link = '';
}

onMounted(fetchTrips);
</script>

<style scoped>
.trip-container {
  margin-bottom: 2rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.trip-header {
  background: var(--surface-alt);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.trip-header h3 {
  margin: 0;
  color: var(--accent);
  font-size: 1.5rem;
}

.trip-dates {
  color: var(--text);
  opacity: 0.8;
}

.trip-actions {
  display: flex;
  gap: 0.5rem;
}

.itinerary-container {
  padding: 1rem;
}

.itinerary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.itinerary-header h4 {
  margin: 0;
  color: var(--primary);
}

.day-section {
  margin-bottom: 2rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.day-header {
  background: var(--surface);
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.day-header h5 {
  margin: 0;
  color: var(--accent);
}

.table-container {
  overflow-x: auto;
  margin-bottom: 1rem;
}

.itinerary-table {
  width: 100%;
  min-width: 600px;
  border-collapse: collapse;
}

.itinerary-table th,
.itinerary-table td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.itinerary-table th {
  background: var(--surface-alt);
  font-weight: 600;
  color: var(--accent);
  position: sticky;
  top: 0;
}

.add-activity-form {
  padding: 1rem;
  background: var(--surface-alt);
}

.add-activity-form h6 {
  margin: 0 0 0.5rem 0;
  color: var(--primary);
}

.edit-activity-form {
  padding: 1rem;
  background: var(--surface-alt);
}

.edit-activity-form h6 {
  margin: 0 0 0.5rem 0;
  color: var(--primary);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr auto;
  gap: 0.5rem;
  align-items: end;
}

.button.small {
  padding: 0.3em 0.6em;
  font-size: 0.85em;
}

.no-itinerary {
  text-align: center;
  padding: 2rem;
  color: var(--accent);
}

.scrollable-cell {
  overflow-x: auto;
  white-space: nowrap;
  max-width: 200px;
  position: relative;
}

.scrollable-cell::-webkit-scrollbar {
  height: 4px;
}

.scrollable-cell::-webkit-scrollbar-track {
  background: var(--surface-alt);
}

.scrollable-cell::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 2px;
}

.scrollable-cell a {
  color: var(--accent);
  text-decoration: none;
  word-break: break-all;
}

.scrollable-cell a:hover {
  text-decoration: underline;
  color: var(--primary);
}

.activity-image {
  max-width: 100px;
  max-height: 100px;
  object-fit: contain;
  margin-top: 0.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.ticket-image-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.current-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.link-display {
  color: var(--accent);
  text-decoration: none;
  word-break: break-all;
}

.link-display:hover {
  text-decoration: underline;
  color: var(--primary);
}

.image-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-image {
  max-width: 100px;
  max-height: 100px;
  object-fit: contain;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.text-display {
  color: var(--text);
  opacity: 0.8;
}

.manual-link-input {
  flex-grow: 1;
  min-width: 0; /* Allow text input to shrink */
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
}

.manual-link-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-light);
}

.ticket-image-input button {
  flex-shrink: 0; /* Prevent button from shrinking */
}

@media (max-width: 1024px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  
  .itinerary-table {
    min-width: 500px;
  }
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .trip-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .itinerary-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .itinerary-table {
    min-width: 400px;
    font-size: 0.9em;
  }
  
  .itinerary-table th,
  .itinerary-table td {
    padding: 0.4rem 0.3rem;
  }
  
  .day-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .itinerary-table {
    min-width: 300px;
    font-size: 0.8em;
  }
  
  .itinerary-table th,
  .itinerary-table td {
    padding: 0.3rem 0.2rem;
  }
  
  .trip-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .trip-actions .button {
    width: 100%;
  }
}
</style>