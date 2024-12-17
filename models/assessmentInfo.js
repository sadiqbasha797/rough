const mongoose = require('mongoose');

const assessmentInfoSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient', // Assuming there is a Patient model
        required: true
    },
    mood: {
        type: String,
        required: true
    },
    moodLevel: {
        type: String,
        enum: ['low', 'medium', 'high'], // Adjusted to include 'high' for more granularity
        required: true
    },
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

module.exports = mongoose.model('AssessmentInfo', assessmentInfoSchema);
