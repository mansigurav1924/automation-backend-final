const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { WebSocketServer } = require('ws');

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
});

// Expose a simple broadcast function globally to avoid passing wss around
global.broadcastResponse = (data) => {
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(data));
    }
  });
};

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

const authRoutes     = require('./routes/authRoutes');
const offerRoutes    = require('./routes/offerRoutes');
const templateRoutes = require('./routes/templateRoutes');
const auditRoutes    = require('./routes/auditRoutes');
const responseRoutes = require('./routes/responseRoutes');
const pdfTemplateRoutes = require('./routes/pdfTemplateRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth',          authRoutes);
app.use('/api/offers',        offerRoutes);
app.use('/api/templates',     templateRoutes);
app.use('/api/pdf-templates', pdfTemplateRoutes);
app.use('/api/audit',         auditRoutes);
app.use('/api/respond',       responseRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/admin',         adminRoutes);

app.get('/', (req, res) => {
  res.send('Offer Letter System API is running.');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Start scheduled jobs after server is up
  const { startExpiryJob } = require('./jobs/expiryJob');
  const { startReminderJob } = require('./jobs/reminderJob');
  startExpiryJob();
  startReminderJob();
});
