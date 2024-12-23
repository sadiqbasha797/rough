const bcrypt = require('bcryptjs');
const Clinisist = require('../models/Clinisist');
const Organization = require('../models/organization');
const createNotification = require('../utils/createNotification');
const sendEmail = require('../utils/mailUtil');
const { uploadFile, deleteFile } = require('../utils/s3Util');

// Handler for registering a Clinisist by an Organization
const registerClinisistOrganization = async (req, res) => {
    const { name, email, password, createdBy } = req.body;

    try {
        const organizationId = req.organization._id;

        // Check if the organization is active
        const organization = await Organization.findById(organizationId);
        if (!organization || !organization.active) {
            return res.status(403).json({
                status: 'error',
                body: null,
                message: 'Organization is not active. Cannot register clinisist.'
            });
        }

        // Check if the Clinisist already exists
        const existingClinisist = await Clinisist.findOne({ email });
        if (existingClinisist) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Clinisist already exists'
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const clinisist = new Clinisist({
            name,
            email,
            createdBy : req.organization._id,
            password: hashedPassword,
            organization: organizationId,
        });

        await clinisist.save();

        // Send email to the registered Clinisist
        const subject = 'Welcome to Our Platform';
        const message = `Dear ${name},\n\nWelcome to our platform. Your account has been created successfully.\n\nBest Regards,\nTeam`;
        await sendEmail(email, subject, message);

        // Send notifications to both Clinisist and organization
        await createNotification(clinisist._id, 'Clinisist', 'You have been registered as a Clinisist', organizationId, 'Organization', 'general');
        await createNotification(organizationId, 'Organization', `A new Clinisist, ${name}, has been registered.`, organizationId, 'Organization', 'general');

        res.status(201).json({
            status: 'success',
            body: clinisist,
            message: 'Clinisist registered successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Handler for registering a Clinisist by an OrgAdmin
const registerClinisistOrgAdmin = async (req, res) => {
    const { name, email, password, createdBy } = req.body;

    try {
        const organizationId = req.orgAdmin.organization;
        console.log("org_id",organizationId);
        const orgadminId = req.orgAdmin._id;

        // Check if the organization is active
        const organization = await Organization.findById(organizationId);
        if (!organization || !organization.active) {
            return res.status(403).json({
                status: 'error',
                body: null,
                message: 'Organization is not active. Cannot register clinisist.'
            });
        }

        const existingClinisist = await Clinisist.findOne({ email });
        if (existingClinisist) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Clinisist already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const clinisist = new Clinisist({
            name,
            email,
            createdBy : req.orgAdmin._id,
            password: hashedPassword,
            organization: organizationId,
        });

        await clinisist.save();

        const subject = 'Welcome to Our Platform';
        const message = `Dear ${name},\n\nWelcome to our platform. Your account has been created successfully.\n\nBest Regards,\nTeam`;
        await sendEmail(email, subject, message);

        await createNotification(clinisist._id, 'Clinisist', 'You have been registered as a Clinisist', orgadminId, 'OrgAdmin', 'general');
        await createNotification(organizationId, 'Organization', `A new Clinisist, ${name}, has been registered by an OrgAdmin.`, orgadminId, 'OrgAdmin', 'general');

        res.status(201).json({
            status: 'success',
            body: clinisist,
            message: 'Clinisist registered successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Handler for registering a Clinisist by a Manager
const registerClinisistManager = async (req, res) => {
    const { name, email, password, createdBy } = req.body;

    try {
        const organizationId = req.manager.organization;
        const managerId = req.manager._id;

        // Check if the organization is active
        const organization = await Organization.findById(organizationId);
        if (!organization || !organization.active) {
            return res.status(403).json({
                status: 'error',
                body: null,
                message: 'Organization is not active. Cannot register clinisist.'
            });
        }

        const existingClinisist = await Clinisist.findOne({ email });
        if (existingClinisist) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Clinisist already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const clinisist = new Clinisist({
            name,
            email,
            createdBy : req.manager._id,
            password: hashedPassword,
            organization: organizationId,
        });

        await clinisist.save();

        const subject = 'Welcome to Our Platform';
        const message = `Dear ${name},\n\nWelcome to our platform. Your account has been created successfully.\n\nBest Regards,\nTeam`;
        await sendEmail(email, subject, message);

        await createNotification(clinisist._id, 'Clinisist', 'You have been registered as a Clinisist', managerId, 'Manager', 'general');
        await createNotification(organizationId, 'Organization', `A new Clinisist, ${name}, has been registered by a Manager.`, managerId, 'Manager', 'general');

        res.status(201).json({
            status: 'success',
            body: clinisist,
            message: 'Clinisist registered successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

const updateClinisistWithImage = async (clinisistId, updateData, imageFile, userType) => {
    const clinisist = await Clinisist.findById(clinisistId);

    if (!clinisist) {
        throw new Error('Clinisist not found');
    }

    // Check if the organization is active
    const organization = await Organization.findById(clinisist.organization);
    if (!organization || !organization.active) {
        throw new Error('Organization is not active. Cannot update clinisist.');
    }

    // If there's a new image file, upload it and update the image URL
    if (imageFile) {
        const fileContent = imageFile.buffer;
        const folderName = `${userType.toLowerCase()}-uploads`;
        const fileName = `${folderName}/clinisist-${clinisistId}-${Date.now()}.${imageFile.mimetype.split('/')[1]}`;

        // Delete the old image if it exists
        if (clinisist.image) {
            const oldImageKey = clinisist.image.split('/').pop();
            await deleteFile(`${folderName}/${oldImageKey}`);
        }

        // Upload the new image
        const imageUrl = await uploadFile(fileContent, fileName, imageFile.mimetype);
        updateData.image = imageUrl;
    }

    // Update the clinisist
    const updatedClinisist = await Clinisist.findByIdAndUpdate(clinisistId, updateData, { new: true });
    return updatedClinisist;
};

const updateClinisistOrganization = async (req, res) => {
    try {
        const { clinisistId } = req.params;
        const updateData = req.body;
        const organizationId = req.organization._id;

        const organization = await Organization.findById(organizationId);
        if (!organization || !organization.active) {
            return res.status(403).json({
                status: 'error',
                body: null,
                message: 'Organization is not active. Cannot update clinisist.'
            });
        }

        const clinisist = await Clinisist.findOne({ _id: clinisistId, organization: organizationId });

        if (!clinisist) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Clinisist not found or does not belong to this organization'
            });
        }

        const updatedClinisist = await updateClinisistWithImage(clinisistId, updateData, req.file, 'Organization');

        res.json({
            status: 'success',
            body: updatedClinisist,
            message: 'Clinisist updated successfully'
        });
    } catch (error) {
        console.error('Error updating Clinisist:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error updating Clinisist'
        });
    }
};

const updateClinisistOrgAdmin = async (req, res) => {
    try {
        const { clinisistId } = req.params;
        const updateData = req.body;
        const organizationId = req.orgAdmin.organization;

        const organization = await Organization.findById(organizationId);
        if (!organization || !organization.active) {
            return res.status(403).json({
                status: 'error',
                body: null,
                message: 'Organization is not active. Cannot update clinisist.'
            });
        }

        const clinisist = await Clinisist.findOne({ _id: clinisistId, organization: organizationId });

        if (!clinisist) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Clinisist not found or does not belong to this organization'
            });
        }

        const updatedClinisist = await updateClinisistWithImage(clinisistId, updateData, req.file, 'OrgAdmin');

        res.json({
            status: 'success',
            body: updatedClinisist,
            message: 'Clinisist updated successfully'
        });
    } catch (error) {
        console.error('Error updating Clinisist:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error updating Clinisist'
        });
    }
};

const updateClinisistManager = async (req, res) => {
    try {
        const { clinisistId } = req.params;
        const updateData = req.body;
        const organizationId = req.manager.organization;

        const organization = await Organization.findById(organizationId);
        if (!organization || !organization.active) {
            return res.status(403).json({
                status: 'error',
                body: null,
                message: 'Organization is not active. Cannot update clinisist.'
            });
        }

        const clinisist = await Clinisist.findOne({ _id: clinisistId, organization: organizationId });

        if (!clinisist) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Clinisist not found or does not belong to this organization'
            });
        }

        const updatedClinisist = await updateClinisistWithImage(clinisistId, updateData, req.file, 'Manager');

        res.json({
            status: 'success',
            body: updatedClinisist,
            message: 'Clinisist updated successfully'
        });
    } catch (error) {
        console.error('Error updating Clinisist:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error updating Clinisist'
        });
    }
};

const deleteClinisistOrganization = async (req, res) => {
    try {
        const { clinisistId } = req.params;
        const organizationId = req.organization._id;

        const organization = await Organization.findById(organizationId);
        if (!organization || !organization.active) {
            return res.status(403).json({
                status: 'error',
                body: null,
                message: 'Organization is not active. Cannot delete clinisist.'
            });
        }

        const clinisist = await Clinisist.findOne({ _id: clinisistId, organization: organizationId });

        if (!clinisist) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Clinisist not found or does not belong to this organization'
            });
        }

        await Clinisist.findByIdAndDelete(clinisistId);

        res.json({
            status: 'success',
            body: null,
            message: 'Clinisist deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting Clinisist:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error deleting Clinisist'
        });
    }
};

const deleteClinisistOrgAdmin = async (req, res) => {
    try {
        const { clinisistId } = req.params;
        const organizationId = req.orgAdmin.organization;

        const organization = await Organization.findById(organizationId);
        if (!organization || !organization.active) {
            return res.status(403).json({
                status: 'error',
                body: null,
                message: 'Organization is not active. Cannot delete clinisist.'
            });
        }

        const clinisist = await Clinisist.findOne({ _id: clinisistId, organization: organizationId });

        if (!clinisist) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Clinisist not found or does not belong to this organization'
            });
        }

        await Clinisist.findByIdAndDelete(clinisistId);

        res.json({
            status: 'success',
            body: null,
            message: 'Clinisist deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting Clinisist:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error deleting Clinisist'
        });
    }
};

const deleteClinisistManager = async (req, res) => {
    try {
        const { clinisistId } = req.params;
        const organizationId = req.manager.organization;

        const organization = await Organization.findById(organizationId);
        if (!organization || !organization.active) {
            return res.status(403).json({
                status: 'error',
                body: null,
                message: 'Organization is not active. Cannot delete clinisist.'
            });
        }

        const clinisist = await Clinisist.findOne({ _id: clinisistId, organization: organizationId });

        if (!clinisist) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Clinisist not found or does not belong to this organization'
            });
        }

        await Clinisist.findByIdAndDelete(clinisistId);

        res.json({
            status: 'success',
            body: null,
            message: 'Clinisist deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting Clinisist:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error deleting Clinisist'
        });
    }
};

module.exports = { 
    registerClinisistOrganization, 
    registerClinisistOrgAdmin, 
    registerClinisistManager,
    updateClinisistOrganization,
    updateClinisistOrgAdmin,
    updateClinisistManager,
    deleteClinisistOrganization,
    deleteClinisistOrgAdmin,
    deleteClinisistManager,
};
