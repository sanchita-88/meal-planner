const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); // Import DB connection logic
const mealRoutes = require('./routes/mealRoutes');
const authRoutes = require('./routes/authRoutes'); // Import Auth routes
const userRoutes = require('./routes/userRoutes');
const cors = require('cors'); // <--- 1. Import CORS

// 1. Load Environment Variables (Must come before connecting to DB)
dotenv.config();

// 2. Connect to MongoDB
connectDB();

const app = express();

// --- FINAL CORS CONFIGURATION ---
const corsOptions = {
    // Allows ANY origin (e.g., your phone's complex network address)
    origin: '*', 
    // CRITICAL: Re-enables sending cookies/auth headers (needed for logged-in requests)
    credentials: true, 
};

app.use(cors(corsOptions));
// --- END CORS CONFIGURATION ---


// 3. Middleware to parse JSON and URL-encoded bodies (MUST be near the top)
// Built-in Express parser for JSON bodies
app.use(express.json()); 
// Added: Middleware to parse complex URL-encoded bodies (critical for POST data)
app.use(express.urlencoded({ extended: true })); 


// 4. Mount Routes
app.use('/api/auth', authRoutes); // Auth: /api/auth/signup, /api/auth/login
app.use('/api', mealRoutes);      // Meals: /api/generate-plan, etc.
app.use('/api/user', userRoutes); // Add this line

// 5. Root Route (Optional check)
app.get('/', (req, res) => res.send('Smart Meal Planner API is running...'));

// 6. Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));