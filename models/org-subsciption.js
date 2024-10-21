const mongoose = require('mongoose');

const orgSubscriptionSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    clinicians: {
        type: Number,
        required: true,
        min: 0
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    validity: {
        type: Number,
        required: true,
        min: 0
    },
    renewal: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const OrgSubscription = mongoose.model('OrgSubscription', orgSubscriptionSchema);

module.exports = OrgSubscription;
