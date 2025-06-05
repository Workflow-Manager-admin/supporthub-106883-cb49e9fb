import React, { useState } from 'react';
import './App.css';

// Color theme constants
const COLORS = {
  primary: '#1A73E8',
  secondary: '#F1F3F4',
  accent: '#34A853',
  text: '#23272F',
  white: '#FFFFFF',
  border: '#E0E0E0',
};

// Ticket statuses
const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved'];

/**
 * Generate a random ID for new tickets (stub for production backend)
 */
function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Format date into readable string
 */
function formatDate(date) {
  return new Date(date).toLocaleString();
}

// PUBLIC_INTERFACE
function App() {
  // State
  const [role, setRole] = useState(null); // 'user' | 'agent'
  const [userName, setUserName] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Tickets are local for demo; In prod, these would be fetched from server.
  const [tickets, setTickets] = useState([
    // Sample for demo
    {
      id: generateId(),
      title: 'Cannot access account',
      description: 'Having trouble logging in since yesterday.',
      createdBy: 'Alice',
      createdAt: new Date(Date.now() - 86400000),
      status: 'Open',
      assignedTo: '',
      updatedAt: new Date(Date.now() - 86000000),
    },
    {
      id: generateId(),
      title: 'Billing discrepancy',
      description: 'Amount on invoice is incorrect.',
      createdBy: 'Bob',
      createdAt: new Date(Date.now() - 43200000),
      status: 'In Progress',
      assignedTo: 'Agent Jane',
      updatedAt: new Date(Date.now() - 43000000),
    }
  ]);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'ticket-create' | 'ticket-detail'
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // ---- LOGIN LOGIC ----

  // PUBLIC_INTERFACE
  function handleLogin(roleSelection, nameInput) {
    setRole(roleSelection);
    setUserName(nameInput);
    setIsAuthenticated(true);
    setActiveView('dashboard');
  }

  // PUBLIC_INTERFACE
  function handleLogout() {
    setRole(null);
    setUserName('');
    setIsAuthenticated(false);
    setActiveView('dashboard');
    setSelectedTicketId(null);
  }

  // ---- TICKET HANDLERS ----

  // PUBLIC_INTERFACE
  function handleCreateTicket(ticket) {
    setTickets(prev => [
      {
        ...ticket,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'Open',
        assignedTo: '',
      },
      ...prev,
    ]);
    setActiveView('dashboard');
  }

  // PUBLIC_INTERFACE
  function handleUpdateTicket(updated) {
    setTickets(prev =>
      prev.map(t =>
        t.id === updated.id
          ? { ...t, ...updated, updatedAt: new Date() }
          : t
      )
    );
    setActiveView('dashboard');
    setSelectedTicketId(null);
  }

  // PUBLIC_INTERFACE
  function handleSelectTicket(id) {
    setSelectedTicketId(id);
    setActiveView('ticket-detail');
  }

  // PUBLIC_INTERFACE
  function handleBackToList() {
    setActiveView('dashboard');
    setSelectedTicketId(null);
  }

  // ---- FILTER VIEWS ----

  let content = null;

  if (!isAuthenticated) {
    content = (
      <LoginPage onLogin={handleLogin} />
    );
  } else if (role === 'user') {
    // User dashboard: Create ticket / list my tickets / view details
    if (activeView === 'dashboard') {
      content = (
        <UserDashboard
          userName={userName}
          tickets={tickets.filter(t => t.createdBy === userName)}
          onCreate={() => setActiveView('ticket-create')}
          onView={handleSelectTicket}
        />
      );
    } else if (activeView === 'ticket-create') {
      content = (
        <TicketCreate
          userName={userName}
          onCreate={handleCreateTicket}
          onCancel={handleBackToList}
        />
      );
    } else if (activeView === 'ticket-detail') {
      const ticket = tickets.find(t => t.id === selectedTicketId);
      content = (
        <TicketDetail
          ticket={ticket}
          role={role}
          userName={userName}
          onBack={handleBackToList}
        />
      );
    }
  } else if (role === 'agent') {
    // Agent dashboard: List all tickets / filter by status / view/update ticket
    if (activeView === 'dashboard') {
      content = (
        <AgentDashboard
          agentName={userName}
          tickets={tickets}
          onView={handleSelectTicket}
        />
      );
    } else if (activeView === 'ticket-detail') {
      const ticket = tickets.find(t => t.id === selectedTicketId);
      content = (
        <TicketDetail
          ticket={ticket}
          role={role}
          userName={userName}
          onBack={handleBackToList}
          onUpdate={handleUpdateTicket}
        />
      );
    }
  }

  return (
    <div
      className="app"
      style={{
        minHeight: '100vh',
        background: COLORS.secondary,
        color: COLORS.text,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Navbar
        role={role}
        userName={userName}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
      />
      <main style={{ flex: 1, marginTop: 76, paddingBottom: 32 }}>
        <div className="container">{content}</div>
      </main>
    </div>
  );
}

// ---------------- NAVBAR ----------------
function Navbar({ role, userName, isAuthenticated, onLogout }) {
  return (
    <nav
      className="navbar"
      style={{
        backgroundColor: COLORS.primary,
        color: COLORS.white,
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <div className="container" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo" style={{ fontWeight: 700, fontSize: 20 }}>
            <span style={{ color: COLORS.accent, fontWeight: 900, fontSize: 28, marginRight: 6 }}>✓</span>
            SupportHub
          </div>
          {isAuthenticated ? (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <span style={{
                background: COLORS.secondary,
                color: COLORS.text,
                fontWeight: 500,
                fontSize: 15,
                borderRadius: 4,
                padding: "7px 14px",
                marginRight: 10,
                letterSpacing: 0.5,
              }}>
                {role === "user" ? "User" : "Support Agent"}: {userName}
              </span>
              <button className="btn" style={{
                background: COLORS.accent,
                color: COLORS.white
              }} onClick={onLogout}>Logout</button>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

// ---------------- LOGIN PAGE ----------------
function LoginPage({ onLogin }) {
  const [role, setRole] = useState('user');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // PUBLIC_INTERFACE
  function handleLogin(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (name.length > 20) {
      setError('Name must be at most 20 characters.');
      return;
    }
    onLogin(role, name.trim());
  }

  return (
    <div
      style={{
        maxWidth: 420,
        margin: '60px auto 0',
        boxShadow: '0 2px 10px #cfd8dc40',
        background: COLORS.white,
        borderRadius: 10,
        padding: 32,
      }}
    >
      <div style={{ marginBottom: 16, fontSize: 28, fontWeight: 700, color: COLORS.primary }}>
        Welcome to SupportHub
      </div>
      <form onSubmit={handleLogin}>
        <label style={{ fontWeight: 600, color: COLORS.text }}>
          Name:
          <input
            type="text"
            required
            value={name}
            maxLength={20}
            onChange={e => { setName(e.target.value); setError(''); }}
            style={{
              width: "100%",
              padding: 10,
              marginTop: 6,
              marginBottom: 18,
              borderRadius: 4,
              border: `1px solid ${COLORS.border}`,
              outline: "none"
            }}
            placeholder="Enter your name"
          />
        </label>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 500, marginBottom: 5 }}>Select Role:</div>
          <label>
            <input
              type="radio"
              name="role"
              value="user"
              checked={role === 'user'}
              onChange={() => setRole('user')}
              style={{ marginRight: 6 }}
            /> User
          </label>
          <label style={{ marginLeft: 16 }}>
            <input
              type="radio"
              name="role"
              value="agent"
              checked={role === 'agent'}
              onChange={() => setRole('agent')}
              style={{ marginRight: 6 }}
            /> Agent
          </label>
        </div>
        {error && (
          <div style={{ color: "#D33", fontSize: 14, marginBottom: 12 }}>{error}</div>
        )}
        <button
          className="btn btn-large"
          type="submit"
          style={{
            width: "100%",
            background: COLORS.primary,
            color: COLORS.white,
            fontWeight: 600,
            fontSize: 16
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}

// ---------------- USER DASHBOARD ----------------
function UserDashboard({ userName, tickets, onCreate, onView }) {
  return (
    <div style={{ padding: '34px 0 0' }}>
      <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: COLORS.primary }}>
        Hello, {userName}!
      </div>
      <div style={{ marginBottom: 24 }}>
        <button className="btn" style={{ background: COLORS.primary, fontWeight: 600 }} onClick={onCreate}>
          + Create New Ticket
        </button>
      </div>
      <section>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 10 }}>
          My Support Tickets ({tickets.length})
        </div>
        {tickets.length === 0 ? (
          <div style={{ color: COLORS.text, background: COLORS.secondary, padding: 30, borderRadius: 8 }}>
            You have not created any tickets yet.
          </div>
        ) : (
          <table style={{
            width: '100%',
            background: COLORS.white,
            borderCollapse: 'collapse',
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 22,
            boxShadow: "0px 2px 14px #e3e7ee30"
          }}>
            <thead>
              <tr style={{ background: COLORS.secondary }}>
                <th style={tableThStyle}>Title</th>
                <th style={tableThStyle}>Status</th>
                <th style={tableThStyle}>Created</th>
                <th style={tableThStyle} />
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr key={ticket.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={tableTdStyle}>{ticket.title}</td>
                  <td style={tableTdStyle}>
                    <TicketStatusPill status={ticket.status} />
                  </td>
                  <td style={tableTdStyle}>{formatDate(ticket.createdAt)}</td>
                  <td style={{ ...tableTdStyle, textAlign: 'center' }}>
                    <button
                      className="btn"
                      style={{ background: COLORS.primary, fontSize: 13, padding: '6px 16px' }}
                      onClick={() => onView(ticket.id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

// ---------------- AGENT DASHBOARD ----------------
function AgentDashboard({ agentName, tickets, onView }) {
  // Filtering tickets by status for simple management
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredTickets =
    statusFilter === 'All'
      ? tickets
      : tickets.filter(t => t.status === statusFilter);

  return (
    <div style={{ padding: '34px 0 0' }}>
      <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 15, color: COLORS.primary }}>
        Welcome, {agentName} (Agent)
      </div>
      <section style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>All Tickets</div>
        <div style={{ marginBottom: 14 }}>
          <span style={{ marginRight: 10, fontWeight: 500 }}>Filter by status:</span>
          <select
            value={statusFilter}
            style={{
              padding: '6px 16px',
              borderRadius: 4,
              border: `1px solid ${COLORS.border}`,
              fontSize: 15
            }}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        {filteredTickets.length === 0 ? (
          <div style={{ color: COLORS.text, background: COLORS.secondary, padding: 30, borderRadius: 8 }}>
            No tickets to display for selected status.
          </div>
        ) : (
          <table style={{
            width: '100%',
            background: COLORS.white,
            borderCollapse: 'collapse',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: "0px 2px 14px #e3e7ee30"
          }}>
            <thead>
              <tr style={{ background: COLORS.secondary }}>
                <th style={tableThStyle}>Title</th>
                <th style={tableThStyle}>Status</th>
                <th style={tableThStyle}>User</th>
                <th style={tableThStyle}>Assigned</th>
                <th style={tableThStyle}>Created</th>
                <th style={tableThStyle} />
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map(ticket => (
                <tr key={ticket.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={tableTdStyle}>{ticket.title}</td>
                  <td style={tableTdStyle}>
                    <TicketStatusPill status={ticket.status} />
                  </td>
                  <td style={tableTdStyle}>{ticket.createdBy}</td>
                  <td style={tableTdStyle}>{ticket.assignedTo || <span style={{ color: COLORS.text, opacity: 0.4 }}>Unassigned</span>}</td>
                  <td style={tableTdStyle}>{formatDate(ticket.createdAt)}</td>
                  <td style={{ ...tableTdStyle, textAlign: 'center' }}>
                    <button
                      className="btn"
                      style={{ background: COLORS.primary, fontSize: 13, padding: '6px 16px' }}
                      onClick={() => onView(ticket.id)}
                    >
                      View / Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

// ---------------- TICKET CREATE (USER) ----------------
function TicketCreate({ userName, onCreate, onCancel }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');

  // PUBLIC_INTERFACE
  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) {
      setError('Title and description are required.');
      return;
    }
    if (title.length > 64) {
      setError('Title max length is 64 characters.');
      return;
    }
    if (desc.length > 500) {
      setError('Description max length is 500 characters.');
      return;
    }
    onCreate({
      title: title.trim(),
      description: desc.trim(),
      createdBy: userName,
    });
  }

  return (
    <div
      style={{
        maxWidth: 420,
        margin: '48px auto 0',
        boxShadow: '0 2px 10px #cfd8dc40',
        background: COLORS.white,
        borderRadius: 10,
        padding: 28,
      }}
    >
      <div style={{ marginBottom: 14, fontSize: 22, fontWeight: 600, color: COLORS.primary }}>Create New Ticket</div>
      <form onSubmit={handleSubmit}>
        <label style={{ fontWeight: 600, color: COLORS.text }}>
          Title:
          <input
            type="text"
            required
            value={title}
            maxLength={64}
            onChange={e => { setTitle(e.target.value); setError(''); }}
            style={inputStyle}
            placeholder="Brief summary of your issue"
          />
        </label>
        <label style={{ fontWeight: 600, color: COLORS.text }}>
          Description:
          <textarea
            required
            value={desc}
            maxLength={500}
            onChange={e => { setDesc(e.target.value); setError(''); }}
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical', marginBottom: 12 }}
            placeholder="Describe the issue in detail"
          />
        </label>
        {error && (
          <div style={{ color: "#D33", fontSize: 14, marginBottom: 10 }}>{error}</div>
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            className="btn"
            type="submit"
            style={{
              background: COLORS.primary,
              color: COLORS.white,
              fontWeight: 600,
              fontSize: 15,
              flex: 1,
            }}
          >
            Submit
          </button>
          <button
            className="btn"
            type="button"
            style={{
              background: COLORS.secondary,
              color: COLORS.primary,
              border: `1.5px solid ${COLORS.primary}`,
              fontWeight: 500,
              flex: 1
            }}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------- TICKET DETAIL / MANAGEMENT ----------------
function TicketDetail({ ticket, role, userName, onBack, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(ticket.status);
  const [assignedTo, setAssignedTo] = useState(ticket.assignedTo);
  const [note, setNote] = useState(ticket.description);

  // Editable for agent only
  const canEdit = role === 'agent' && !!onUpdate;

  // PUBLIC_INTERFACE
  function handleUpdate(e) {
    e.preventDefault();
    // Only allow update if status/assigned changed
    if (
      ticket.status !== status ||
      ticket.assignedTo !== assignedTo ||
      ticket.description !== note
    ) {
      onUpdate({
        ...ticket,
        status,
        assignedTo,
        description: note,
      });
    }
    setEditing(false);
  }

  return (
    <div
      style={{
        maxWidth: 520,
        margin: '48px auto 0',
        boxShadow: '0 2px 10px #cfd8dc40',
        background: COLORS.white,
        borderRadius: 10,
        padding: 30,
      }}
    >
      <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          className="btn"
          onClick={onBack}
          style={{
            padding: '4px 14px',
            fontSize: 14,
            background: COLORS.secondary,
            color: COLORS.primary,
            border: `1.5px solid ${COLORS.primary}`,
          }}
        >Back</button>
        <div style={{
          fontSize: 22,
          fontWeight: 600,
          color: COLORS.primary,
          marginLeft: 10
        }}>
          Ticket Detail
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 17, color: COLORS.text }}>{ticket.title}</div>
        <div style={{ margin: '7px 0', color: COLORS.text, fontSize: 14, opacity: 0.75 }}>By {ticket.createdBy}</div>
        <div style={{
          display: 'flex', gap: 16, marginBottom: 8, marginTop: 8,
        }}>
          <TicketStatusPill status={ticket.status} />
          <span style={{ color: '#8796ad', fontSize: 13 }}>Created: {formatDate(ticket.createdAt)}</span>
        </div>
      </div>
      <form onSubmit={handleUpdate}>
        <div style={{ color: COLORS.text, marginBottom: 13, fontWeight: 600 }}>Description:</div>
        {canEdit && editing ? (
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{ ...inputStyle, minHeight: 70, marginBottom: 10 }}
          />
        ) : (
          <div style={{
            color: COLORS.text,
            background: COLORS.secondary,
            padding: 14,
            borderRadius: 6,
            fontSize: 15,
            marginBottom: 10,
            whiteSpace: "pre-line"
          }}>{ticket.description}</div>
        )}
        <div style={{ color: COLORS.text, marginBottom: 5 }}>Status:</div>
        {canEdit && editing ? (
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            style={{
              ...inputStyle,
              minWidth: 120,
              maxWidth: 160,
              marginBottom: 10,
            }}
          >
            {STATUS_OPTIONS.map(s => (
              <option value={s} key={s}>{s}</option>
            ))}
          </select>
        ) : (
          <TicketStatusPill status={ticket.status} />
        )}
        {canEdit && editing && (
          <>
            <div style={{ color: COLORS.text, marginTop: 12 }}>Assign to:</div>
            <input
              type="text"
              value={assignedTo || ''}
              onChange={e => setAssignedTo(e.target.value)}
              placeholder="Enter your name"
              style={{
                ...inputStyle,
                marginBottom: 10
              }}
            />
          </>
        )}
        {canEdit && (
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            {editing ? (
              <>
                <button
                  className="btn"
                  type="submit"
                  style={{
                    background: COLORS.accent,
                    color: COLORS.white,
                    fontWeight: 600,
                    fontSize: 15,
                    flex: 1,
                  }}
                >Save</button>
                <button
                  className="btn"
                  type="button"
                  style={{
                    background: COLORS.secondary,
                    color: COLORS.primary,
                    border: `1.5px solid ${COLORS.primary}`,
                    fontWeight: 500,
                    flex: 1,
                  }}
                  onClick={() => {
                    setEditing(false);
                    setStatus(ticket.status);
                    setAssignedTo(ticket.assignedTo);
                    setNote(ticket.description);
                  }}
                >Cancel</button>
              </>
            ) : (
              <button
                className="btn"
                type="button"
                style={{
                  background: COLORS.primary,
                  color: COLORS.white,
                  fontWeight: 600,
                  fontSize: 15,
                  flex: 1,
                }}
                onClick={() => setEditing(true)}
              >Edit</button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

// ------------- REUSABLE: Ticket status pill --------------
function TicketStatusPill({ status }) {
  let bg = COLORS.primary, color = COLORS.white;
  if (status === "Open") {
    bg = COLORS.primary;
    color = COLORS.white;
  } else if (status === "In Progress") {
    bg = COLORS.accent;
    color = COLORS.white;
  } else if (status === "Resolved") {
    bg = "#00897B";
    color = COLORS.white;
  }
  return (
    <span style={{
      display: "inline-block",
      background: bg,
      color: color,
      fontWeight: 600,
      fontSize: 13,
      borderRadius: 20,
      padding: "4px 16px",
      margin: "2px 0"
    }}>{status}</span>
  );
}

// ------------- Styles -------------
const tableThStyle = {
  padding: '12px 10px',
  textAlign: 'left',
  background: COLORS.secondary,
  color: COLORS.text,
  borderBottom: `2px solid ${COLORS.primary}`,
  fontWeight: 700,
  fontSize: 15,
};

const tableTdStyle = {
  padding: '10px 10px',
  textAlign: 'left',
  color: COLORS.text,
  fontSize: 15,
  background: COLORS.white,
};

const inputStyle = {
  width: "100%",
  padding: 10,
  marginTop: 7,
  marginBottom: 18,
  borderRadius: 4,
  border: `1.5px solid ${COLORS.border}`,
  outline: "none",
  fontSize: 15,
  background: COLORS.secondary,
};

export default App;
