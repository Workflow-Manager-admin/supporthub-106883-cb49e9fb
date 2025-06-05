const express = require('express');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const router = express.Router();

// Auth/session middleware
function requireLogin(req, res, next) {
  if (!req.session.userId || !req.session.role) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// PUBLIC_INTERFACE
// GET /api/tickets
// Users get their own tickets, agent gets all (with optional status filter)
router.get('/', requireLogin, async (req, res) => {
  const role = req.session.role;
  let query = {};
  if (role === 'user') {
    query.createdBy = req.session.userId;
  } else if (role === 'agent') {
    // Can pass status as ?status=Open
    if (req.query.status) {
      query.status = req.query.status;
    }
  }
  const tickets = await Ticket.find(query).sort({ createdAt: -1 });
  res.json({ tickets });
});

// PUBLIC_INTERFACE
// POST /api/tickets
// (user only) Create a ticket
router.post('/', requireLogin, async (req, res) => {
  if (req.session.role !== 'user') {
    return res.status(403).json({ error: "Only users can create tickets" });
  }
  const { title, description } = req.body;
  if (!title || !description) return res.status(400).json({ error: "Missing fields" });

  const ticket = new Ticket({
    title,
    description,
    createdBy: req.session.userId,
    createdByName: req.session.name,
    status: 'Open',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  await ticket.save();

  res.json({ ticket });
});

// PUBLIC_INTERFACE
// GET /api/tickets/:id
// Get single ticket (user: must own, agent: any)
router.get('/:id', requireLogin, async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  // User can only view their own tickets
  if (req.session.role === 'user' && ticket.createdBy.toString() !== req.session.userId) {
    return res.status(403).json({ error: "Not authorized" });
  }
  res.json({ ticket });
});

// PUBLIC_INTERFACE
// PATCH /api/tickets/:id
// Agents can update: status, assignedTo, description
router.patch('/:id', requireLogin, async (req, res) => {
  if (req.session.role !== 'agent') {
    return res.status(403).json({ error: "Agent only" });
  }
  const { status, assignedTo, description } = req.body;
  const update = {};
  if (status) update.status = status;
  if (typeof assignedTo === 'string') update.assignedTo = assignedTo;
  if (typeof description === 'string') update.description = description;
  update.updatedAt = new Date();

  const ticket = await Ticket.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });
  res.json({ ticket });
});

module.exports = router;
