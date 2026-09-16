/**
 * Thin wrapper around fetch() for talking to the Event Management backend.
 * Change API_BASE_URL if your backend runs on a different host/port.
 */
const API_BASE_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  let body = null;
  try {
    body = await res.json();
  } catch (err) {
    // no JSON body (e.g. some error responses) - that's fine
  }

  if (!res.ok) {
    const message = (body && body.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
}

const api = {
  // Events
  listEvents: () => request('/events'),
  getEvent: (id) => request(`/events/${id}`),
  createEvent: (data) =>
    request('/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id, data) =>
    request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id) => request(`/events/${id}`, { method: 'DELETE' }),

  // Attendees
  listAttendees: (eventId) => request(`/events/${eventId}/attendees`),
  registerAttendee: (eventId, data) =>
    request(`/events/${eventId}/attendees`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  removeAttendee: (eventId, attendeeId) =>
    request(`/events/${eventId}/attendees/${attendeeId}`, { method: 'DELETE' }),

  // Schedule
  listSchedule: (eventId) => request(`/events/${eventId}/schedule`),
  addScheduleItem: (eventId, data) =>
    request(`/events/${eventId}/schedule`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  removeScheduleItem: (eventId, itemId) =>
    request(`/events/${eventId}/schedule/${itemId}`, { method: 'DELETE' })
};