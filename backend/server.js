require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/test", require("./routes/testRoutes"));

app.use("/api/participant", require("./routes/participantRoutes"));
app.use("/api/organizer", require("./routes/organizerRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/registrations", require("./routes/registrationRoutes"));

// route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to MERN API' });
});

// Error handler 
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Server Error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});