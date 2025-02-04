const mongoose = require('mongoose');

const assistantPermissionSchema = new mongoose.Schema({
    assistantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assistant',
        required: true,
        unique: true
    },
    permissions: {
        dashboard: {
            type: Boolean,
            default: false
        },
        earnings: {
            type: Boolean,
            default: false
        },
        patientManagement: {
            type: Boolean,
            default: false
        },
        clinicianManagement: {
            type: Boolean,
            default: false
        },
        organizationManagement: {
            type: Boolean,
            default: false
        },
        assistantManagement: {
            type: Boolean,
            default: false
        },
        planManagement: {
            type: Boolean,
            default: false
        },
        recommendation: {
            type: Boolean,
            default: false
        },
        patientSubscription: {
            type: Boolean,
            default: false
        },
        clinicianSubscription: {
            type: Boolean,
            default: false
        },
        organizationSubscription: {
            type: Boolean,
            default: false
        },
        assessments: {
            type: Boolean,
            default: false
        },
        announcements: {
            type: Boolean,
            default: false
        },
        payments : {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true
});

// Create index on assistantId
assistantPermissionSchema.index({ assistantId: 1 });

const AssistantPermission = mongoose.model('AssistantPermission', assistantPermissionSchema);

module.exports = AssistantPermission; 