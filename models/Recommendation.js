const mongoose = require('mongoose');

// Define the schema for related media with Cloudinary URLs
const mediaSchema = new mongoose.Schema({
    images: [{
        url: {
            type: String, 
            required: false
        },
        public_id: {
            type: String, 
            required: false
        }
    }],
    documents: [{
        url: {
            type: String, 
            required: false
        },
        public_id: {
            type: String, 
            required: false
        }
    }],
    videos: [{
        url: {
            type: String, 
            required: false
        },
        public_id: {
            type: String, 
            required: false
        }
    }]
});

// Define the recommendation schema
const recommendationSchema = new mongoose.Schema({
    category: {
        type: String,
        required: false
    },
    recommendation: {
        type: String,
        required: true
    },
    relatedMedia: mediaSchema,
    recommendedBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'recommendedByModel',
        required: false
    },
    recommendedByModel: {
        type: String,
        enum: ['Clinisist', 'Admin'],
        required: false
    },
    recommendedTo: {
        type: mongoose.Schema.Types.ObjectId, // Patient's ID
        ref: 'Patient',
        required: true
    },
    type: {
        type: String,
        enum: ['portal', 'doctor'],
        required: true,
        default : 'portal'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

module.exports = Recommendation;
