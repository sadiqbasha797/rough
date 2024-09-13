const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the BodyAssessment Schema
const bodyAssessmentSchema = new Schema({
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['mcq', 'blanks'],
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    part: {
        type: Schema.Types.ObjectId,
        ref: 'Body', // Referencing the Body model
        required: true
    },
    media: {
        type: String,
        default: null,
    },
    mcqOptions: [{
        text: { type: String, required: false },
        color: { type: Schema.Types.ObjectId, ref: 'Color', required: true } // Each option associated with a Color
    }]
});

const BodyAssessment = mongoose.model('BodyAssessment', bodyAssessmentSchema);

module.exports = BodyAssessment;
