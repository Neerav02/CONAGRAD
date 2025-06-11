const mongoose = require('mongoose');

const expertSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: String,
    expertise: [String],
    education: String,
    experience: String,
    rating: { type: Number, default: 0, min: 0, max: 5 },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expert', expertSchema);