import React, { useState, useEffect } from 'react';
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

const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved'];
const API_BASE = 'http://localhost:4001/api'; // adjust if deployed elsewhere

// PUBLIC_INTERFACE
function App() {
  const [role, setRole] = useState(null); // 'user' | 'agent'
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState(null);

  // UI navigation & select
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'ticket-create' | 'ticket-detail'
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(false);

  // On first render, check session (persisted login)
  useEffect(() => {
    setGlobalLoading(true);
    fetch(`${API_BASE}/auth/me`, {
      credentials: 'include'
    })
      .then(r => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(json => {
        setRole(json.user.role);
        setUserName(json.user.name);
        setUserEmail(json.user.email);
        setIsAuthenticated(true);
      })
      .catch(() => {
        setRole(null);
        setUserName('');
        setIsAuthenticated(false);
      })
      .finally(() => setGlobalLoading(false));
  }, []);

  // Whenever auth/role changes, fetch tickets if authenticated
  useEffect(() => {
    if (isAuthenticated && role) {
      fetchTickets();
    } else {
      setTickets([]);
    }
    // eslint-disable-next-line
  }, [isAuthenticated, role]);

  // Fetch tickets, agent gets all, user gets theirs
  function fetchTickets() {
    setTicketsLoading(true);
    setTicketsError(null);
    fetch(`${API_BASE}/tickets`, {
      credentials: 'include'
    })
      .then(r => {
        if (!r.ok) throw r;
        return r.json();
      })
      .then(json => {
        setTickets(
          json.tickets.map(t => ({
            ...t,
            id: t._id,
            createdBy: t.createdByName || '',
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt)
          }))
        );
      })
      .catch(async r => {
        let err = 'Failed to fetch tickets';
        if (r.json) {
          try { const data = await r.json(); err = data.error || err; } catch{}
        }
        setTickets([]);
        setTicketsError(err);
      })
      .finally(() => setTicketsLoading(false));
  }

  // ---- LOGIN LOGIC ----

  // PUBLIC_INTERFACE
  function handleLogin({ email, password, role: inputRole, name, isRegister }, onError) {
    setGlobalLoading(true);
    const path = isRegister ? '/auth/signup' : '/auth/login';
    fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(
        isRegister
          ? { name, email, password, role: inputRole }
          : { email, password }
      ),
    })
      .then(async r => {
        if (!r.ok) {
          let errMsg = 'Failed';
          try { const data = await r.json(); errMsg = data.error || errMsg; } catch {}
          throw new Error(errMsg);
        }
        return r.json();
      })
      .then(json => {
        setRole(json.user.role);
        setUserName(json.user.name);
        setUserEmail(json.user.email);
        setIsAuthenticated(true);
        setActiveView('dashboard');
      })
      .catch(e => {
        onError(e.message || 'Login/Register failed.');
      })
      .finally(() => setGlobalLoading(false));
  }

  // PUBLIC_INTERFACE
  function handleLogout() {
    setGlobalLoading(true);
    fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    })
      .then(() => {
        setRole(null);
        setUserName('');
        setUserEmail('');
        setIsAuthenticated(false);
        setActiveView('dashboard');
        setSelectedTicketId(null);
      })
      .finally(() => setGlobalLoading(false));
  }

  // ---- TICKET HANDLERS ----

  // PUBLIC_INTERFACE
  function handleCreateTicket(ticket, onError, onSuccess) {
    setGlobalLoading(true);
    fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: ticket.title,
        description: ticket.description
      })
    })
      .then(async r => {
        if (!r.ok) {
          let err = 'Failed to create ticket';
          try { err = (await r.json()).error || err; } catch {}
          throw new Error(err);
        }
        return r.json();
      })
      .then(json => {
        // Append to tickets (optimistically); or simply refresh
        // setTickets(prev => [toClientTicket(json.ticket), ...prev]);
        fetchTickets();
        setActiveView('dashboard');
        if (onSuccess) onSuccess();
      })
      .catch(e => {
        if (onError) onError(e.message || 'Error creating ticket');
      })
      .finally(() => setGlobalLoading(false));
  }

  // PUBLIC_INTERFACE
  function handleUpdateTicket(updated, onError, onSuccess) {
    setGlobalLoading(true);
    fetch(`${API_BASE}/tickets/${updated.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        status: updated.status,
        assignedTo: updated.assignedTo,
        description: updated.description
      })
    })
      .then(async r => {
        if (!r.ok) {
          let err = 'Failed to update ticket';
          try { err = (await r.json()).error || err; } catch {}
          throw new Error(err);
        }
        return r.json();
      })
      .then(json => {
        // setTickets(prev => prev.map(t => t.id === updated.id ? toClientTicket(json.ticket) : t));
        fetchTickets();
        if (onSuccess) onSuccess();
        setActiveView('dashboard');
        setSelectedTicketId(null);
      })
      .catch(e => {
        if (onError) onError(e.message || 'Error updating ticket');
      })
      .finally(() => setGlobalLoading(false));
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

  if (globalLoading) {
    content = (
      <div style={{ margin: '60px auto', textAlign: 'center', color: COLORS.primary }}>
        <div className="spinner" style={{
          margin: '0 auto 16px', width: 32, height: 32, border: '4px solid #eee', borderTop: `4px solid ${COLORS.primary}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        Loading...
      </div>
    );
  } else if (!isAuthenticated) {
    content = (
      <LoginPage onLogin={handleLogin} loading={globalLoading} />
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
          loading={ticketsLoading}
          error={ticketsError}
        />
      );
    } else if (activeView === 'ticket-create') {
      content = (
        <TicketCreate
          userName={userName}
          onCreate={handleCreateTicket}
          onCancel={handleBackToList}
          loading={globalLoading}
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
          loading={ticketsLoading}
          error={ticketsError}
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
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
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

// ---------------- LOGIN / REGISTER PAGE ----------------
function LoginPage({ onLogin, loading }) {
  const [role, setRole] = useState('user');
  const [register, setRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  // for login, hide name input, show on register

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (register) {
      if (!name.trim()) return setError('Enter name.');
      if (!email.trim()) return setError('Enter email.');
      if (!pw.trim()) return setError('Enter password.');
      if (!['user', 'agent'].includes(role)) return setError('Select a role.');
      onLogin({ email, password: pw, role, name, isRegister: true }, setError);
    } else {
      if (!email.trim() || !pw.trim()) return setError('Enter email and password.');
      onLogin({ email, password: pw, isRegister: false }, setError);
    }
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
        {register ? "Register for SupportHub" : "Welcome to SupportHub"}
      </div>
      <form onSubmit={handleSubmit}>
        {register &&
          <label style={{ fontWeight: 600, color: COLORS.text }}>
            Name:
            <input
              type="text"
              required={register}
              value={name}
              maxLength={32}
              onChange={e => setName(e.target.value)}
              style={{ ...inputStyle, marginBottom: 9 }}
              placeholder="Your full name"
              autoComplete="name"
            />
          </label>
        }
        <label style={{ fontWeight: 600, color: COLORS.text }}>
          Email:
          <input
            type="email"
            required
            value={email}
            maxLength={40}
            onChange={e => setEmail(e.target.value)}
            style={{ ...inputStyle, marginBottom: 9 }}
            placeholder="your@email.com"
            autoComplete="username"
          />
        </label>
        <label style={{ fontWeight: 600, color: COLORS.text }}>
          Password:
          <input
            type="password"
            required
            value={pw}
            maxLength={32}
            onChange={e => setPw(e.target.value)}
            style={inputStyle}
            placeholder="Password"
            autoComplete={register ? "new-password" : "current-password"}
          />
        </label>
        {register && (
          <div style={{ margin: '12px 0 16px' }}>
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
        )}
        {error && (
          <div style={{ color: "#D33", fontSize: 14, marginBottom: 12, minHeight: 24 }}>{error}</div>
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
          disabled={loading}
        >
          {register ? "Register" : "Login"}
        </button>
      </form>
      <div style={{ marginTop: 14, fontSize: 15, color: COLORS.text, textAlign: 'center' }}>
        {register ? (
          <>
            Already have an account?{' '}
            <span style={{ color: COLORS.primary, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setRegister(false); setError(''); }}>Login</span>
          </>
        ) : (
          <>
            New user or agent?{' '}
            <span style={{ color: COLORS.primary, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setRegister(true); setError(''); }}>Register</span>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------- USER DASHBOARD ----------------
function UserDashboard({ userName, tickets, onCreate, onView, loading, error }) {
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
        {loading ? (
          <div style={{ color: COLORS.primary, padding: 16 }}>Loading your tickets...</div>
        ) : error ? (
          <div style={{ color: "#D33", background: COLORS.white, padding: 18, borderRadius: 5 }}>{error}</div>
        ) : tickets.length === 0 ? (
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
function AgentDashboard({ agentName, tickets, onView, loading, error }) {
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
        {loading ? (
          <div style={{ color: COLORS.primary, padding: 16 }}>Loading tickets...</div>
        ) : error ? (
          <div style={{ color: "#D33", background: COLORS.white, padding: 18, borderRadius: 5 }}>{error}</div>
        ) : filteredTickets.length === 0 ? (
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
function TicketCreate({ userName, onCreate, onCancel, loading }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
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
    onCreate(
      { title: title.trim(), description: desc.trim(), createdBy: userName },
      setError
    );
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
            disabled={loading}
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
            disabled={loading}
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
  const [assignedTo, setAssignedTo] = useState(ticket.assignedTo || '');
  const [note, setNote] = useState(ticket.description);
  const [error, setError] = useState('');

  // Editable for agent only
  const canEdit = role === 'agent' && !!onUpdate;

  function handleUpdate(e) {
    e.preventDefault();
    setError('');
    // Only allow update if status/assigned changed
    if (
      ticket.status !== status ||
      ticket.assignedTo !== assignedTo ||
      ticket.description !== note
    ) {
      onUpdate(
        {
          ...ticket,
          status,
          assignedTo,
          description: note,
        },
        setError,
        () => setEditing(false)
      );
    } else {
      setEditing(false);
    }
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
        {error && (<div style={{ color: "#D33", fontSize: 14, margin: '7px 0 10px' }}>{error}</div>)}
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
                    setAssignedTo(ticket.assignedTo || '');
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

// ------------- Utilities & Style -------------
function formatDate(date) {
  if (!(date instanceof Date)) return '';
  return date.toLocaleString();
}

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
