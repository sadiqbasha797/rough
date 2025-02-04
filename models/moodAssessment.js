
const mongoose = require('mongoose');

const moodAssessmentSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    answer: {
        type: [{
            option: {
                type: String,
                required: true
            },
            moodLevel: {
                type: String,
                enum: ['low', 'medium', 'extreme'],
                required: true
            }
        }],
        validate: [arrayLimit, 'Must have exactly 3 options']
    },
    type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Color', // Assuming there is a Color model
        required: true
    }
});

// Custom validation function to ensure exactly 3 options
function arrayLimit(val) {
    return val.length === 3;
}

module.exports = mongoose.model('MoodAssessment', moodAssessmentSchema);
