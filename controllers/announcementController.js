const Announcement = require('../models/announcement');
const { uploadFile, deleteFile, getFileUrl } = require('../utils/s3Util');

exports.createAnnouncement = async (req, res) => {
    try {
        const { title, content, startDate, endDate, type } = req.body;
        let media = null;

        if (req.file) {
            const fileContent = req.file.buffer;
            const key = `announcements/${Date.now()}-${req.file.originalname}`;
            const mimeType = req.file.mimetype;
            // Resize image to 1080 x 680 before uploading
            const resizedImage = await resizeImage(fileContent, 1080, 680);
            media = await uploadFile(resizedImage, key, mimeType);
        }

        const announcement = new Announcement({
            title,
            content,
            media,
            startDate,
            endDate,
            type
        });

        await announcement.save();
        res.status(201).json({
            status: 'success',
            body: announcement,
            message: 'Announcement created successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error creating announcement'
        });
    }
};

exports.getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find();
        res.json({
            status: 'success',
            body: announcements,
            message: 'Announcements retrieved successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error retrieving announcements'
        });
    }
};

exports.getAnnouncementById = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findById(id);

        if (!announcement) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Announcement not found'
            });
        }

        res.json({
            status: 'success',
            body: announcement,
            message: 'Announcement retrieved successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error retrieving announcement'
        });
    }
};

exports.updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, startDate, endDate } = req.body;
        let updateData = { title, content, startDate, endDate };

        if (req.file) {
            const fileContent = req.file.buffer;
            const key = `announcements/${Date.now()}-${req.file.originalname}`;
            const mimeType = req.file.mimetype;
            const media = await uploadFile(fileContent, key, mimeType);
            updateData.media = media;
        }

        updateData.type = type || announcement.type;

        const announcement = await Announcement.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!announcement) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Announcement not found'
            });
        }

        res.json({
            status: 'success',
            body: announcement,
            message: 'Announcement updated successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error updating announcement'
        });
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findByIdAndDelete(id);

        if (!announcement) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Announcement not found'
            });
        }

        if (announcement.media) {
            const key = announcement.media.split('/').slice(-2).join('/');
            await deleteFile(key);
        }

        res.json({
            status: 'success',
            body: null,
            message: 'Announcement deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error deleting announcement'
        });
    }
}; 
