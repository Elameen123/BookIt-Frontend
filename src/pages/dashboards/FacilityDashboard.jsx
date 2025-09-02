import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import './FacilityDashboard.css';

const ROOM_STATUS = {
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
};

const UTIL_STATE = {
  WORKING: 'WORKING',
  FAULTY: 'FAULTY',
};

const statusMeta = {
  AVAILABLE: { label: 'Available', cls: 'bg-emerald-100 text-emerald-700' },
  UNAVAILABLE: { label: 'Unavailable', cls: 'bg-rose-100 text-rose-700' },
};

const utilMeta = {
  WORKING: { label: 'Working' },
  FAULTY: { label: 'Faulty' },
};

// seed data 
const seedRooms = [
  // SST
  { id: 'SST-CR1', building: 'SST', name: 'CLASSROOM 1', seats: 50 },
  { id: 'SST-CR2', building: 'SST', name: 'CLASSROOM 2', seats: 50 },
  { id: 'SST-CR3', building: 'SST', name: 'CLASSROOM 3', seats: 50 },
  { id: 'SST-CR4', building: 'SST', name: 'CLASSROOM 4', seats: 50 },
  { id: 'SST-LAB-THERMO', building: 'SST', name: 'THERMOFLUID LAB', seats: 50 },
  { id: 'SST-SYN-1', building: 'SST', name: 'SYNDICATE ROOM 1', seats: 15 },
  { id: 'SST-EDS', building: 'SST', name: 'EDS', seats: 100 },
  // TYD
  { id: 'TYD-ASABA', building: 'TYD', name: 'ASABA', seats: 50 },
  { id: 'TYD-ZARIA', building: 'TYD', name: 'ZARIA', seats: 35 },
  { id: 'TYD-IBADAN', building: 'TYD', name: 'IBADAN', seats: 40 },
  { id: 'TYD-MAIDUGURI', building: 'TYD', name: 'MAIDUGURI', seats: 25 },
  { id: 'TYD-ADO', building: 'TYD', name: 'ADO EKITI', seats: 75 },
  { id: 'TYD-PH', building: 'TYD', name: 'PORT HARCOURT', seats: 75 },
  { id: 'TYD-ABUJA', building: 'TYD', name: 'ABUJA', seats: 150 }
];

const defaultUtilities = () => ({
  projector: UTIL_STATE.WORKING,
  ac: UTIL_STATE.WORKING,
  power: UTIL_STATE.WORKING,
});

// Build default state per room
const initialRoomState = () =>
  seedRooms.reduce((acc, r) => {
    acc[r.id] = {
      status: ROOM_STATUS.AVAILABLE,
      utilities: defaultUtilities(),
      notes: []
    };
    return acc;
  }, {});

// small UI atoms 
function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function pillClass(status) {
  switch (status) {
    case ROOM_STATUS.AVAILABLE:    return 'status-pill status-available';
    default:                       return 'status-pill status-unavailable';
  }
}

// Room Card
function RoomCard({ room, state, onChange }) {
  const [noteInput, setNoteInput] = useState('');

  const cycleUtil = (key) => {
    const order = [UTIL_STATE.WORKING, UTIL_STATE.FAULTY];
    const idx = order.indexOf(state.utilities[key]);
    const next = order[(idx + 1) % order.length];
    onChange({ ...state, utilities: { ...state.utilities, [key]: next } });
  };

  const setStatus = (s) => onChange({ ...state, status: s });

  const addNote = () => {
    if (!noteInput.trim()) return;
    onChange({ ...state, notes: [{ text: noteInput.trim(), ts: Date.now() }, ...state.notes] });
    setNoteInput('');
  };

  return (
    <div className="room-card">
      <div className="room-top">
        <div>
          <div className="room-name">{room.name}</div>
          <div className="room-meta">{room.building} • {room.seats} seats</div>
        </div>
        <span className={pillClass(state.status)}>
          {statusMeta[state.status].label}
        </span>
      </div>

      <div className="utilities">
        {Object.keys(state.utilities).map((k) => {
          const v = state.utilities[k];
          const utilCls =
            v === UTIL_STATE.WORKING ? 'utility-chip utility-working'
            : 'utility-chip utility-faulty';
          return (
            <button key={k} onClick={() => cycleUtil(k)} className={utilCls}>
              {k} • {utilMeta[v].label}
            </button>
          );
        })}
      </div>

      <div className="status-actions">
        {Object.entries(ROOM_STATUS).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setStatus(val)}
            className={`status-btn ${state.status === val ? 'active' : ''}`}
          >
            {statusMeta[val].label}
          </button>
        ))}
      </div>

      <div className="note-input-row">
        <input
          className="note-input"
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          placeholder="Add extra information..."
        />
        <button className="note-add-btn" onClick={addNote}>Add</button>
      </div>

      {state.notes.length > 0 && (
        <ul className="note-list">
          {state.notes.map((n, i) => (
            <li key={i} className="note-item">
              <span>{n.text}</span>
              <span className="note-time">{new Date(n.ts).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}



// Main page
export default function FacilityDashboard() {
  const { user, logout } = useAuth();
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const [dateDraft, setDateDraft] = useState(todayISO());
  const [buildingDraft, setBuildingDraft] = useState('ALL');
  const [dateApplied, setDateApplied] = useState(todayISO());
  const [buildingApplied, setBuildingApplied] = useState('ALL');
  const [roomsState, setRoomsState] = useState(initialRoomState);

    const applyFilters = () => {
    setDateApplied(dateDraft);
    setBuildingApplied(buildingDraft);
  };

  const clearFilters = () => {
    const t = todayISO();
    setDateDraft(t);
    setBuildingDraft('ALL');
    setDateApplied(t);
    setBuildingApplied('ALL');
  };

    const visibleRoomIds = useMemo(
    () => (buildingApplied === 'ALL'
      ? seedRooms.map(r => r.id)
      : seedRooms.filter(r => r.building === buildingApplied).map(r => r.id)),
    [buildingApplied]
  );


  const grouped = useMemo(() => {
    const base = buildingApplied === 'ALL'
      ? seedRooms
      : seedRooms.filter(r => r.building === buildingApplied);
    return base.reduce((acc, r) => {
      (acc[r.building] ||= []).push(r);
      return acc;
    }, {});
  }, [buildingApplied]);

  const updateRoom = (id, nextState) => {
    setRoomsState((s) => ({ ...s, [id]: nextState }));
  };

  const counts = useMemo(() => {
    const c = { AVAILABLE: 0, UNAVAILABLE: 0 };
    for (const id of visibleRoomIds) {
      const rs = roomsState[id];
      if (rs) c[rs.status] += 1;
    }
    return c;
  }, [roomsState, visibleRoomIds]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="header">
        <a className="logo" href="#">
          <FontAwesomeIcon icon={faCalendarCheck} />
          <span className="logo_differentiate">PAU</span>BookIt
        </a>
        <div className="user-info">
          <p className='facility-user'>Hello, Facility User</p>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </header>

      {/* Content */}
      <main className="dashboard-container">
  <section className="main-content">
    <div className="control-panel">
      <div className="panel-header">
        <h2>Classroom Status</h2>
      </div>

      <div className="filter-controls">
        <div className="filter-group">
          <label>Date</label>
          <input type="date" value={dateDraft}
            onChange={(e) => setDateDraft(e.target.value)}
            className="filter-input" />
        </div>

        <div className="filter-group">
          <label>Filter by Location</label>
          <select value={buildingDraft}
                  onChange={(e) => setBuildingDraft(e.target.value)}
                  className="filter-select">
            <option value="ALL">All Locations</option>
            <option value="SST">SST</option>
            <option value="TYD">TYD</option>
          </select>
        </div>

              <div className="filter-actions">
          <button className="primary-btn" type="button" onClick={applyFilters}>
            Apply Filters
          </button>
          <button className="secondary-btn" type="button" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>
          </div>
          {/* KPI cards */}
      <div className="kpi-cards">
        <div className="kpi-card kpi available">
          <div>
            <div className="kpi-value">{counts.AVAILABLE}</div>
            <div className="kpi-label">Available</div>
          </div>
        </div>
        <div className="kpi-card kpi unavailable">
          <div className="kpi-value">{counts.UNAVAILABLE}</div>
          <div className="kpi-label">Unavailable</div>
        </div>
      </div>
        </section>

        {/* Boards by building */}
        {Object.entries(grouped).map(([bld, rooms]) => (
  <section key={bld}>
    <div className="section-header">
      <h2>{bld} Building</h2>
    </div>

    <div className="rooms-grid">
      {rooms.map((r) => (
        <RoomCard
          key={r.id}
          room={r}
          state={roomsState[r.id]}
          onChange={(next) => updateRoom(r.id, next)}
        />
      ))}
    </div>
  </section>
))}

      </main>
    </div>
  );
}
