/* Event Management System - frontend app logic
   No framework/build step: plain DOM + fetch, talking to the Express API. */

const state = {
  events: [],
  currentEventId: null
};

const els = {
  apiStatus: document.getElementById('api-status'),

  viewList: document.getElementById('view-list'),
  viewDetail: document.getElementById('view-detail'),

  eventsList: document.getElementById('events-list'),
  eventsEmpty: document.getElementById('events-empty'),
  eventCount: document.getElementById('event-count'),

  createForm: document.getElementById('create-event-form'),
  createMessage: document.getElementById('create-event-message'),

  backBtn: document.getElementById('back-to-list'),
  deleteEventBtn: document.getElementById('delete-event-btn'),
  detailTitle: document.getElementById('detail-title'),
  detailMeta: document.getElementById('detail-meta'),
  detailDescription: document.getElementById('detail-description'),

  attendeeCount: document.getElementById('attendee-count'),
  attendeesList: document.getElementById('attendees-list'),
  attendeesEmpty: document.getElementById('attendees-empty'),
  registerForm: document.getElementById('register-attendee-form'),
  registerMessage: document.getElementById('register-message'),

  scheduleForm: document.getElementById('add-schedule-form'),
  scheduleMessage: document.getElementById('schedule-message'),
  scheduleList: document.getElementById('schedule-list'),
  scheduleEmpty: document.getElementById('schedule-empty')
};

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function formatDateParts(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { day: '--', month: '---' };
  return { day: String(d.getDate()).padStart(2, '0'), month: MONTHS[d.getMonth()] };
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = Number(h);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = ((hour + 11) % 12) + 1;
  return `${hour12}:${m} ${suffix}`;
}

function showMessage(el, text, kind) {
  el.textContent = text;
  el.className = 'form-message' + (kind ? ` ${kind}` : '');
}

function switchView(view) {
  els.viewList.hidden = view !== 'list';
  els.viewDetail.hidden = view !== 'detail';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* --------------------------- API health check --------------------------- */

async function checkApiStatus() {
  try {
    const res = await fetch('http://localhost:5000/');
    if (res.ok) {
      els.apiStatus.textContent = 'API connected';
      els.apiStatus.className = 'masthead-meta online';
      return true;
    }
    throw new Error('not ok');
  } catch (err) {
    els.apiStatus.textContent = 'API offline — start the backend';
    els.apiStatus.className = 'masthead-meta offline';
    return false;
  }
}

/* ------------------------------ Events list ------------------------------ */

async function loadEvents() {
  try {
    state.events = await api.listEvents();
    renderEventsList();
  } catch (err) {
    els.eventsList.innerHTML = '';
    els.eventsEmpty.hidden = false;
    els.eventsEmpty.querySelector('p').textContent = `Could not load events: ${err.message}`;
  }
}

function renderEventsList() {
  els.eventCount.textContent = state.events.length;
  els.eventsList.innerHTML = '';

  if (state.events.length === 0) {
    els.eventsEmpty.hidden = false;
    return;
  }
  els.eventsEmpty.hidden = true;

  state.events.forEach((event) => {
    const { day, month } = formatDateParts(event.date);
    const isFull = event.capacity !== null && event.registeredCount >= event.capacity;

    const card = document.createElement('div');
    card.className = 'ticket';
    card.innerHTML = `
      <div class="ticket-body" data-id="${event.id}">
        <h3>${escapeHtml(event.title)}</h3>
        <p class="ticket-loc">${escapeHtml(event.location)}</p>
        <div class="ticket-tags">
          <span class="tag">${event.registeredCount} registered${event.capacity !== null ? ` / ${event.capacity}` : ''}</span>
          <span class="tag">${event.scheduleCount} session${event.scheduleCount === 1 ? '' : 's'}</span>
          ${isFull ? '<span class="tag full">Full</span>' : ''}
        </div>
      </div>
      <div class="ticket-date">
        <span class="day">${day}</span>
        <span class="month">${month}</span>
        <span class="time">${formatTime(event.time)}</span>
      </div>
    `;
    card.querySelector('.ticket-body').addEventListener('click', () => openEvent(event.id));
    els.eventsList.appendChild(card);
  });
}

els.createForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(els.createForm);
  const payload = {
    title: formData.get('title').trim(),
    description: formData.get('description').trim(),
    date: formData.get('date'),
    time: formData.get('time'),
    location: formData.get('location').trim(),
    capacity: formData.get('capacity')
  };

  try {
    await api.createEvent(payload);
    showMessage(els.createMessage, 'Event added to the program.', 'success');
    els.createForm.reset();
    await loadEvents();
  } catch (err) {
    showMessage(els.createMessage, err.message, 'error');
  }
});

/* ------------------------------ Event detail ------------------------------ */

async function openEvent(id) {
  state.currentEventId = id;
  switchView('detail');
  showMessage(els.registerMessage, '', '');
  showMessage(els.scheduleMessage, '', '');
  await refreshEventDetail();
}

async function refreshEventDetail() {
  const id = state.currentEventId;
  if (!id) return;

  try {
    const event = await api.getEvent(id);
    renderEventDetail(event);
  } catch (err) {
    els.detailTitle.textContent = 'Could not load event';
    els.detailMeta.textContent = err.message;
  }
}

function renderEventDetail(event) {
  els.detailTitle.textContent = event.title;
  const { day, month } = formatDateParts(event.date);
  els.detailMeta.textContent = `${day} ${month} · ${formatTime(event.time)} · ${event.location}`;
  els.detailDescription.textContent = event.description || '';

  // Attendees
  const cap = event.capacity !== null ? event.capacity : '\u221e';
  els.attendeeCount.textContent = `${event.attendees.length} / ${cap}`;
  els.attendeesList.innerHTML = '';
  els.attendeesEmpty.hidden = event.attendees.length !== 0;

  event.attendees.forEach((a) => {
    const li = document.createElement('li');
    li.className = 'attendee-row';
    li.innerHTML = `
      <div class="who">
        <strong>${escapeHtml(a.name)}</strong>
        <span>${escapeHtml(a.email)}${a.phone ? ' · ' + escapeHtml(a.phone) : ''}</span>
      </div>
      <button class="remove-btn" data-id="${a.id}">Remove</button>
    `;
    li.querySelector('.remove-btn').addEventListener('click', () => removeAttendee(a.id));
    els.attendeesList.appendChild(li);
  });

  // Schedule, sorted by start time
  const schedule = [...event.schedule].sort((a, b) => a.startTime.localeCompare(b.startTime));
  els.scheduleList.innerHTML = '';
  els.scheduleEmpty.hidden = schedule.length !== 0;

  schedule.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'timetable-item';
    li.innerHTML = `
      <div class="time-range">${formatTime(item.startTime)} &ndash; ${formatTime(item.endTime)}</div>
      <h4>${escapeHtml(item.title)}</h4>
      ${item.speaker ? `<div class="speaker">${escapeHtml(item.speaker)}</div>` : ''}
      ${item.description ? `<div class="notes">${escapeHtml(item.description)}</div>` : ''}
      <button class="remove-btn" data-id="${item.id}">Remove</button>
    `;
    li.querySelector('.remove-btn').addEventListener('click', () => removeScheduleItem(item.id));
    els.scheduleList.appendChild(li);
  });
}

els.backBtn.addEventListener('click', async () => {
  switchView('list');
  await loadEvents();
});

els.deleteEventBtn.addEventListener('click', async () => {
  if (!state.currentEventId) return;
  if (!confirm('Delete this event? This also removes its attendees and schedule.')) return;

  try {
    await api.deleteEvent(state.currentEventId);
    switchView('list');
    await loadEvents();
  } catch (err) {
    alert(`Could not delete event: ${err.message}`);
  }
});

els.registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(els.registerForm);
  const payload = {
    name: formData.get('name').trim(),
    email: formData.get('email').trim(),
    phone: formData.get('phone').trim()
  };

  try {
    await api.registerAttendee(state.currentEventId, payload);
    showMessage(els.registerMessage, 'Attendee registered.', 'success');
    els.registerForm.reset();
    await refreshEventDetail();
  } catch (err) {
    showMessage(els.registerMessage, err.message, 'error');
  }
});

async function removeAttendee(attendeeId) {
  try {
    await api.removeAttendee(state.currentEventId, attendeeId);
    await refreshEventDetail();
  } catch (err) {
    alert(`Could not remove attendee: ${err.message}`);
  }
}

els.scheduleForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(els.scheduleForm);
  const payload = {
    title: formData.get('title').trim(),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    speaker: formData.get('speaker').trim(),
    description: formData.get('description').trim()
  };

  if (payload.endTime <= payload.startTime) {
    showMessage(els.scheduleMessage, 'End time must be after start time.', 'error');
    return;
  }

  try {
    await api.addScheduleItem(state.currentEventId, payload);
    showMessage(els.scheduleMessage, 'Session added.', 'success');
    els.scheduleForm.reset();
    await refreshEventDetail();
  } catch (err) {
    showMessage(els.scheduleMessage, err.message, 'error');
  }
});

async function removeScheduleItem(itemId) {
  try {
    await api.removeScheduleItem(state.currentEventId, itemId);
    await refreshEventDetail();
  } catch (err) {
    alert(`Could not remove session: ${err.message}`);
  }
}

/* --------------------------------- Utils --------------------------------- */

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

/* --------------------------------- Init ---------------------------------- */

(async function init() {
  await checkApiStatus();
  await loadEvents();
})();