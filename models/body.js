const mongoose = require('mongoose');

// Define the schema for the Body model
const bodySchema = new mongoose.Schema({
    partName: {
        type: String,
        required: true,
        unique: true, // Ensures that the partName is unique
        trim: true // Removes whitespace from the start and end of the string
    },
    description: {
        type: String,
        required: true,
        trim: true // Removes whitespace from the start and end of the string
    }
}, {
    timestamps: true // Automatically adds `createdAt` and `updatedAt` fields
});

// Create the Body model from the schema
const Body = mongoose.model('Body', bodySchema);

module.exports = Body;
