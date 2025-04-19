require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const pitchRoutes = require('./routes/pitches');
const path = require('path');
const fs = require('fs');
require('./config/passport')(passport);
  
const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
}

// Enable CORS with specific configuration
app.use((req, res, next) => {
    const allowedOrigins = ['http://127.0.0.1:5500', 'http://localhost:5500'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(session({ secret: 'yourSecret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve favicon
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, path) => {
        // Set appropriate headers for different file types
        if (path.endsWith('.mp4')) {
            res.setHeader('Content-Type', 'video/mp4');
        } else if (path.endsWith('.pdf')) {
            res.setHeader('Content-Type', 'application/pdf');
        } else if (path.endsWith('.ppt') || path.endsWith('.pptx')) {
            res.setHeader('Content-Type', 'application/vnd.ms-powerpoint');
        }
    }
}));

app.get('/', (req, res) => {
    res.send('Welcome to the Auth Backend');
  });
  

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

app.use('/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/pitches', pitchRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Server also accessible at http://127.0.0.1:${PORT}`);
});

const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);