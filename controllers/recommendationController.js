const Recommendation = require('../models/Recommendation');
const s3Util = require('../utils/s3Util');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid'); // For generating unique file names

// Multer setup to handle file uploads
const storage = multer.memoryStorage(); // Store files in memory temporarily
const upload = multer({ storage: storage }).fields([
    { name: 'images', maxCount: 10 },
    { name: 'documents', maxCount: 10 },
    { name: 'videos', maxCount: 10 }
]);

// Create a new recommendation
const createRecommendation = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Error uploading media:', err);
            return res.status(500).json({ status: 'error', body: null, message: 'Error uploading media' });
        }

        const { category, recommendation, recommendedBy, type } = req.body;
        const relatedMedia = {
            images: [],
            documents: [],
            videos: []
        };

        try {
            // Process uploaded images
            if (req.files.images) {
                for (const file of req.files.images) {
                    const key = `images/${uuidv4()}_${file.originalname}`;
                    const url = await s3Util.uploadFile(file.buffer, key, file.mimetype);
                    relatedMedia.images.push({ url, public_id: key });
                }
            }

            // Process uploaded documents
            if (req.files.documents) {
                for (const file of req.files.documents) {
                    const key = `documents/${uuidv4()}_${file.originalname}`;
                    const url = await s3Util.uploadFile(file.buffer, key, file.mimetype);
                    relatedMedia.documents.push({ url, public_id: key });
                }
            }

            // Process uploaded videos
            if (req.files.videos) {
                for (const file of req.files.videos) {
                    const key = `videos/${uuidv4()}_${file.originalname}`;
                    const url = await s3Util.uploadFile(file.buffer, key, file.mimetype);
                    relatedMedia.videos.push({ url, public_id: key });
                }
            }

            // Create and save the recommendation
            const newRecommendation = new Recommendation({
                category,
                recommendation,
                relatedMedia,
                recommendedBy,
                type
            });

            await newRecommendation.save();

            res.status(201).json({
                status: 'success',
                body: newRecommendation,
                message: 'Recommendation created successfully'
            });
        } catch (error) {
            console.error('Error creating recommendation:', error);
            res.status(500).json({
                status: 'error',
                body: null,
                message: 'Error creating recommendation'
            });
        }
    });
};

// Get all recommendations
const getRecommendations = async (req, res) => {
    try {
        const recommendations = await Recommendation.find({});
        res.json({
            status: 'success',
            body: recommendations,
            message: 'Recommendations retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error retrieving recommendations'
        });
    }
};

// Get a single recommendation by ID
const getRecommendationById = async (req, res) => {
    try {
        const recommendation = await Recommendation.findById(req.params.id);
        if (!recommendation) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Recommendation not found'
            });
        }
        res.json({
            status: 'success',
            body: recommendation,
            message: 'Recommendation retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error retrieving recommendation'
        });
    }
};

// Update a recommendation
const updateRecommendation = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Error uploading media:', err);
            return res.status(500).json({ status: 'error', body: null, message: 'Error uploading media' });
        }

        try {
            const recommendationId = req.params.id;
            const { category, recommendation, recommendedBy, type } = req.body;
            const mediaUpdates = {
                images: [],
                documents: [],
                videos: []
            };

            // Process new media uploads
            if (req.files.images) {
                for (const file of req.files.images) {
                    const key = `images/${uuidv4()}_${file.originalname}`;
                    const url = await s3Util.uploadFile(file.buffer, key, file.mimetype);
                    mediaUpdates.images.push({ url, public_id: key });
                }
            }

            if (req.files.documents) {
                for (const file of req.files.documents) {
                    const key = `documents/${uuidv4()}_${file.originalname}`;
                    const url = await s3Util.uploadFile(file.buffer, key, file.mimetype);
                    mediaUpdates.documents.push({ url, public_id: key });
                }
            }

            if (req.files.videos) {
                for (const file of req.files.videos) {
                    const key = `videos/${uuidv4()}_${file.originalname}`;
                    const url = await s3Util.uploadFile(file.buffer, key, file.mimetype);
                    mediaUpdates.videos.push({ url, public_id: key });
                }
            }

            // Update the recommendation with new details and media
            const updatedRecommendation = await Recommendation.findByIdAndUpdate(
                recommendationId,
                {
                    category,
                    recommendation,
                    recommendedBy,
                    type,
                    $push: {
                        'relatedMedia.images': { $each: mediaUpdates.images },
                        'relatedMedia.documents': { $each: mediaUpdates.documents },
                        'relatedMedia.videos': { $each: mediaUpdates.videos }
                    }
                },
                { new: true, runValidators: true }
            );

            if (!updatedRecommendation) {
                return res.status(404).json({
                    status: 'error',
                    body: null,
                    message: 'Recommendation not found'
                });
            }

            res.json({
                status: 'success',
                body: updatedRecommendation,
                message: 'Recommendation updated successfully'
            });
        } catch (error) {
            console.error('Error updating recommendation:', error);
            res.status(500).json({
                status: 'error',
                body: null,
                message: 'Error updating recommendation'
            });
        }
    });
};



// Delete a recommendation
const deleteRecommendation = async (req, res) => {
    try {
        // Find and delete the recommendation
        const recommendation = await Recommendation.findByIdAndDelete(req.params.id);

        if (!recommendation) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Recommendation not found'
            });
        }

        // Delete media from S3
        const { relatedMedia } = recommendation;

        const deleteMedia = async (mediaArray) => {
            for (let media of mediaArray) {
                try {
                    await s3Util.deleteFile(media.public_id);
                } catch (error) {
                    console.error(`Error deleting file with public_id ${media.public_id}:`, error);
                }
            }
        };

        await deleteMedia(relatedMedia.images);
        await deleteMedia(relatedMedia.documents);
        await deleteMedia(relatedMedia.videos);

        res.json({
            status: 'success',
            body: null,
            message: 'Recommendation deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting recommendation:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error deleting recommendation'
        });
    }
};



// Fetch Doctor Recommendations by Category
const getDoctorRecommendations = async (req, res) => {
    try {
        const category = req.params.category;

        // Fetch recommendations of type 'doctor' and populate the recommendedBy field with the clinician's details
        const doctorRecommendations = await Recommendation.find({
            category: category,
            type: 'doctor'
        }).populate('recommendedBy'); // Populate with Clinisist data

        if (doctorRecommendations.length === 0) {
            return res.status(404).json({
                status: "error",
                body: null,
                message: "No doctor recommendations found for this category"
            });
        }

        res.json({
            status: "success",
            body: doctorRecommendations,
            message: "Doctor recommendations retrieved successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: "error",
            body: null,
            message: "An error occurred while retrieving doctor recommendations"
        });
    }
};

// Fetch Portal Recommendations by Category
const getPortalRecommendations = async (req, res) => {
    try {
        const category = req.params.category;
        const portalRecommendations = await Recommendation.find({
            category: category,
            type: 'portal'
        });

        if (portalRecommendations.length === 0) {
            return res.status(404).json({
                status: "error",
                body: null,
                message: "No portal recommendations found for this category"
            });
        }

        res.json({
            status: "success",
            body: portalRecommendations,
            message: "Portal recommendations retrieved successfully"
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            body: null,
            message: "An error occurred while retrieving portal recommendations"
        });
    }
};


// Create a new recommendation
const createDoctorRecommendation = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Error uploading media:', err);
            return res.status(500).json({
                status: 'error',
                body: null,
                message: 'Error uploading media'
            });
        }

        const { category, recommendation, type } = req.body;
        const recommendedBy = req.clinisist._id; // Assuming clinician's ID is stored in req.user._id
        const relatedMedia = {
            images: [],
            documents: [],
            videos: []
        };

        // Process uploaded files and store URLs and public_ids in relatedMedia
        if (req.files.images) {
            req.files.images.forEach(file => {
                relatedMedia.images.push({ url: file.path, public_id: file.filename });
            });
        }
        if (req.files.documents) {
            req.files.documents.forEach(file => {
                relatedMedia.documents.push({ url: file.path, public_id: file.filename });
            });
        }
        if (req.files.videos) {
            req.files.videos.forEach(file => {
                relatedMedia.videos.push({ url: file.path, public_id: file.filename });
            });
        }

        try {
            const newRecommendation = new Recommendation({
                category,
                recommendation,
                relatedMedia,
                recommendedBy,
                type: 'doctor' // Set the type to 'doctor' for clinician recommendations
            });
            await newRecommendation.save();

            res.status(201).json({
                status: 'success',
                body: newRecommendation,
                message: 'Recommendation created successfully'
            });
        } catch (error) {
            console.error('Error creating recommendation:', error);
            res.status(500).json({
                status: 'error',
                body: null,
                message: 'Error creating recommendation'
            });
        }
    });
};

const deleteMedia = async (req, res) => {
    const { recommendationId, mediaType, mediaId } = req.params;

    // Validate media type
    if (!['images', 'documents', 'videos'].includes(mediaType)) {
        return res.status(400).json({
            status: 'error',
            body: null,
            message: 'Invalid media type'
        });
    }

    try {
        // Find the recommendation
        const recommendation = await Recommendation.findById(recommendationId);

        if (!recommendation) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Recommendation not found'
            });
        }

        // Find and remove the media item
        const mediaList = recommendation.relatedMedia[mediaType];
        const mediaIndex = mediaList.findIndex(media => media._id.toString() === mediaId);

        if (mediaIndex === -1) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Media item not found'
            });
        }

        // Delete the media file from S3
        await s3Util.deleteFile(mediaList[mediaIndex].public_id);

        // Remove media from the recommendation
        mediaList.splice(mediaIndex, 1);

        // Save the updated recommendation
        const updatedRecommendation = await recommendation.save();

        res.json({
            status: 'success',
            body: updatedRecommendation,
            message: 'Media deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting media:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error deleting media'
        });
    }
};


module.exports = {
    deleteMedia,
    createDoctorRecommendation,
    createRecommendation,
    getRecommendations,
    getRecommendationById,
    updateRecommendation,
    deleteRecommendation,
    getDoctorRecommendations,
    getPortalRecommendations
};
