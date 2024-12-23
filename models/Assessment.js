const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const assessmentSchema = new mongoose.Schema({
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
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Color', // Referencing the Color (mood) model
        required: true
    },
    media: {
        type: String,
        default: null,
    },
    video: {
        type: String,
        default: null,
    },
    mcqOptions: [{
        text: { type: String, required: false },
        isCorrect: { type: Boolean, required: false, default: false }
    }],
  
});

const Assessment = mongoose.model('Assessment', assessmentSchema);

module.exports = Assessment;
