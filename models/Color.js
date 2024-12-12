const mongoose = require('mongoose');

// Define the schema for Mood Colors
const colorSchema = new mongoose.Schema({
    mood: {
        type: String,
        required: true,
        unique: true // Ensure each mood is unique
    },
    hexColor: {
        type: String,
        required: true,
        match: /^#([0-9A-F]{3}){1,2}$/i // Validate hex color format
    },
    description: {
        type: String,
        required: true
    }
});

// Create and export the Color model
const Color = mongoose.models.Color || mongoose.model('Color', colorSchema);

module.exports = Color;
