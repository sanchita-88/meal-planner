const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // 1. Auth Details
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },

  // 2. The Physical Profile
profile: {
    type: Object, // Ensure Mongoose knows this is an object field
    default: {}, // <--- CRITICAL FIX: Ensures validation passes if {} is passed during signup
    // These nested fields are now optional, as the default above satisfies Mongoose
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female'] },
    height: { type: Number },
    weight: { type: Number },
    activity: { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'] },
    goal: { type: String, enum: ['weight_loss', 'maintenance', 'muscle_gain'] },
    diet: { type: String, enum: ['veg', 'vegan', 'non-veg'] },
    allergies: [String],
    dislikes: [String]
},

 // 3. The AI Memory Bank 🧠
preferences: {
    type: Object, // <--- ADD THIS LINE
    default: {}, // <--- ADD THIS CRITICAL FIX
    interactionHistory: [{
      foodId: String,
      // --- FIX IS HERE: Added 'disliked' to the list ---
      action: { type: String, enum: ['accepted', 'rejected', 'liked', 'disliked'] }, 
      timestamp: { type: Date, default: Date.now }
    }],
    tagScores: {
      type: Map,
      of: Number,
     default: {}
    }
},

  // 4. Reset Password Fields
  resetPasswordOtp: String,
  resetPasswordExpire: Date,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);