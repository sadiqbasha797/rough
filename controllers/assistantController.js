const Assistant = require('../models/assistant');
const AssistantPermission = require('../models/assistantPermission');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { uploadFile, deleteFile, getFileUrl } = require('../utils/s3Util');

// Register Assistant
const registerAssistant = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const assistantExists = await Assistant.findOne({ email });

        if (assistantExists) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Assistant already exists',
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const assistant = await Assistant.create({
            name,
            email,
            password: hashedPassword,
        });

        if (assistant) {
            await AssistantPermission.create({
                assistantId: assistant._id,
                permissions: {
                    dashboard: false,
                    earnings: false,
                    patientManagement: false,
                    clinicianManagement: false,
                    organizationManagement: false,
                    assistantManagement: false,
                    planManagement: false,
                    recommendation: false,
                    patientSubscription: false,
                    clinicianSubscription: false,
                    organizationSubscription: false,
                    assessments: false,
                    announcements: false,
                    payments: false
                }
            });

            res.status(201).json({
                status: 'success',
                body: {
                    id: assistant._id,
                    name: assistant.name,
                    email: assistant.email,
                    token: jwt.sign({ id: assistant._id }, process.env.JWT_SECRET, {
                        expiresIn: '1d',
                    }),
                },
                message: 'Assistant registered successfully',
            });
        } else {
            res.status(400).json({
                status: 'error',
                body: null,
                message: 'Invalid assistant data'
            });
        }
    } catch (err) {
        console.error('Registration error:', err);
        if (err.message.includes('permissions') && req.assistant) {
            await Assistant.findByIdAndDelete(req.assistant._id);
        }
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message,
        });
    }
};

// Login Assistant
const loginAssistant = async (req, res) => {
    const { email, password } = req.body;

    try {
        const assistant = await Assistant.findOne({ email });

        if (assistant && (await bcrypt.compare(password, assistant.password))) {
            res.json({
                status: 'success',
                body: {
                    id: assistant._id,
                    name: assistant.name,
                    email: assistant.email,
                    role : 'assistant',
                    token: jwt.sign({ id: assistant._id }, process.env.JWT_SECRET, {
                        expiresIn: '1d',
                    }),
                },
                message: 'Login successful'
            });
        } else {
            res.status(401).json({
                status: 'error',
                body: null,
                message: 'Invalid credentials'
            });
        }
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message,
        });
    }
};

// Get Assistant Profile
const getAssistantProfile = async (req, res) => {
    try {
        const assistantData = req.assistant.toObject ? req.assistant.toObject() : req.assistant;

        res.json({
            status: "success",
            body: assistantData,
            message: "Assistant profile retrieved successfully"
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            body: null,
            message: "An error occurred while retrieving the assistant profile"
        });
    }
};

// Update Assistant Name
const updateAssistantName = async (req, res) => {
    const { newName } = req.body;

    try {
        const assistant = await Assistant.findById(req.assistant._id);

        if (assistant) {
            assistant.name = newName;
            await assistant.save();
            res.json({
                status: "success",
                body: { name: assistant.name },
                message: "Name updated successfully"
            });
        } else {
            res.status(404).json({
                status: "error",
                body: null,
                message: "Assistant not found"
            });
        }
    } catch (err) {
        res.status(500).json({
            status: "error",
            body: null,
            message: err.message
        });
    }
};

// Update Assistant Password
const updateAssistantPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    try {
        const assistant = await Assistant.findById(req.assistant._id);

        if (assistant && (await bcrypt.compare(oldPassword, assistant.password))) {
            const salt = await bcrypt.genSalt(10);
            assistant.password = await bcrypt.hash(newPassword, salt);
            await assistant.save();
            res.json({
                status: "success",
                body: null,
                message: "Password changed successfully"
            });
        } else {
            res.status(401).json({
                status: "error",
                body: null,
                message: "Old password not correct"
            });
        }
    } catch (err) {
        res.status(500).json({
            status: "error",
            body: null,
            message: err.message
        });
    }
};

// Update Assistant Info
const updateAssistantInfo = async (req, res) => {
    try {
        const assistantId = req.assistant._id;
        const {
            name,
            email,
            address,
            socialMediaLinks,
            contact,
            bio
        } = req.body;

        const assistant = await Assistant.findById(assistantId);

        if (!assistant) {
            return res.status(404).json({
                status: "error",
                body: null,
                message: "Assistant not found"
            });
        }

        // Update fields if provided
        if (name) assistant.name = name;
        if (email) assistant.email = email;
        if (address) assistant.address = address;
        if (socialMediaLinks) assistant.socialMediaLinks = socialMediaLinks;
        if (contact) assistant.contact = contact;
        if (bio) assistant.bio = bio;

        await assistant.save();

        res.status(200).json({
            status: "success",
            body: assistant,
            message: "Assistant information updated successfully"
        });
    } catch (error) {
        console.error('Error updating assistant information:', error);
        res.status(500).json({
            status: "error",
            body: null,
            message: "An error occurred while updating assistant information"
        });
    }
};

// Update Assistant Media
const updateAssistantMedia = async (req, res) => {
    try {
        const assistantId = req.assistant._id;
        const assistant = await Assistant.findById(assistantId);

        if (!assistant) {
            return res.status(404).json({
                status: "error",
                body: null,
                message: "Assistant not found"
            });
        }

        // Handle profile image update
        if (req.files && req.files.image) {
            // Delete existing profile image if it exists
            if (assistant.image) {
                const previousKey = assistant.image.split('/').pop();
                await deleteFile(`assistant_images/${previousKey}`);
            }

            // Upload new profile image
            const fileKey = `assistant_images/${Date.now()}_${req.files.image.name}`;
            const imageUrl = await uploadFile(
                req.files.image.data,
                fileKey,
                req.files.image.mimetype
            );
            assistant.image = imageUrl;
        }

        await assistant.save();

        res.status(200).json({
            status: "success",
            body: {
                image: assistant.image
            },
            message: "Assistant media updated successfully"
        });
    } catch (error) {
        console.error('Error updating assistant media:', error);
        res.status(500).json({
            status: "error",
            body: null,
            message: "An error occurred while updating assistant media"
        });
    }
};

// Delete Assistant
const deleteAssistant = async (req, res) => {
    try {
        const assistant = await Assistant.findById(req.assistant._id);

        if (assistant) {
            // Delete profile image if it exists
            if (assistant.image) {
                const previousKey = assistant.image.split('/').pop();
                await deleteFile(`assistant_images/${previousKey}`);
            }

            await Assistant.deleteOne({ _id: req.assistant._id });
            res.json({
                status: "success",
                body: null,
                message: "Assistant deleted successfully"
            });
        } else {
            res.status(404).json({
                status: "error",
                body: null,
                message: "Assistant not found"
            });
        }
    } catch (err) {
        res.status(500).json({
            status: "error",
            body: null,
            message: err.message
        });
    }
};

const getAssistantCounts = async (req, res) => {
    try {
        // Get total count of all assistants
        const totalCount = await Assistant.countDocuments();
        
        // Get count of active assistants
        const activeCount = await Assistant.countDocuments({ isActive: true });
        
        // Get count of inactive assistants
        const inactiveCount = await Assistant.countDocuments({ isActive: false });

        // Calculate counts by login status (optional)
        const loggedInToday = await Assistant.countDocuments({
            lastLogin: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)) // Start of today
            }
        });

        res.status(200).json({
            status: 'success',
            body: {
                total: totalCount,
                activeCount: activeCount,
                inactiveCount: inactiveCount,
                loggedInToday: loggedInToday
            },
            message: 'Assistant counts retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching assistant counts:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching assistant counts',
            error: error.message
        });
    }
};

const updateAssistantPermissions = async (req, res) => {
    try {
        const { assistantId } = req.params;
        const { permissions } = req.body;
        console.log(assistantId);
        // Validate if assistantId exists
        const assistant = await Assistant.findById(assistantId);
        if (!assistant) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Assistant not found'
            });
        }

        // Find and update permissions
        const updatedPermissions = await AssistantPermission.findOneAndUpdate(
            { assistantId },
            { 
                permissions: {
                    dashboard: Boolean(permissions.dashboard),
                    earnings: Boolean(permissions.earnings),
                    patientManagement: Boolean(permissions.patientManagement),
                    clinicianManagement: Boolean(permissions.clinicianManagement),
                    organizationManagement: Boolean(permissions.organizationManagement),
                    assistantManagement: Boolean(permissions.assistantManagement),
                    planManagement: Boolean(permissions.planManagement),
                    recommendation: Boolean(permissions.recommendation),
                    patientSubscription: Boolean(permissions.patientSubscription),
                    clinicianSubscription: Boolean(permissions.clinicianSubscription),
                    organizationSubscription: Boolean(permissions.organizationSubscription),
                    assessments: Boolean(permissions.assessments),
                    announcements: Boolean(permissions.announcements),
                    payments: Boolean(permissions.payments)
                }
            },
            { new: true }
        );

        if (!updatedPermissions) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Permissions not found for this assistant'
            });
        }

        res.status(200).json({
            status: 'success',
            body: updatedPermissions,
            message: 'Permissions updated successfully'
        });

    } catch (error) {
        console.error('Error updating assistant permissions:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error updating permissions',
            error: error.message
        });
    }
};

const getAssistantPermissions = async (req, res) => {
    try {
        const { assistantId } = req.params;

        const permissions = await AssistantPermission.findOne({ assistantId });

        if (!permissions) {
            return res.status(200).json({
                status: 'success',
                body: null,
                message: 'No permissions found for this assistant'
            });
        }

        res.status(200).json({
            status: 'success',
            body: permissions,
            message: 'Permissions retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching assistant permissions:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error fetching permissions',
            error: error.message
        });
    }
};

module.exports = {
    registerAssistant,
    loginAssistant,
    getAssistantProfile,
    updateAssistantName,
    updateAssistantPassword,
    updateAssistantInfo,
    updateAssistantMedia,
    deleteAssistant,
    getAssistantCounts,
    updateAssistantPermissions,
    getAssistantPermissions
}; 