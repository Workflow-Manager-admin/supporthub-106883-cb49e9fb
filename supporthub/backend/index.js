//
// Entry point for SupportHub backend server (Node.js/Express)
// Provides API endpoints for authentication, role-based session, tickets CRUD
//
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4001;

// --- Middleware ---
app.use(cors({
  origin: 'http://localhost:3000',   // React frontend default
  credentials: true
}));
app.use(express.json());

// --- Session Setup ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'supporthub_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/supporthub',
    collectionName: 'sessions',
  }),
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 8 // 8 hours
  }
}));

// --- DB Connection ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/supporthub', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'SupportHub API running.' });
});

app.listen(PORT, () => {
  console.log(`SupportHub backend server running on port ${PORT}`);
});
