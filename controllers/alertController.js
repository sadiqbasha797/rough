const Alert = require('../models/alert');
const Clinisist = require('../models/Clinisist');
const createNotification = require('../utils/createNotification'); // Assuming you have this utility
const calculateDistance = require('../utils/calculateDistance');

const createAlert = async (req, res) => {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
        return res.status(400).json({
            status: "error",
            body: null,
            message: "Latitude and longitude are required"
        });
    }

    try {
        // Extract patient details from the token (assuming `req.patient` is populated by the authentication middleware)
        const patient_mobile_num = req.patient.mobile;
        const patient_name = req.patient.userName;
        const patient_location = { latitude, longitude };
        const patient_id = req.patient._id;

        // Find all clinicians
        const clinisists = await Clinisist.find({});

        if (clinisists.length === 0) {
            return res.status(404).json({
                status: "error",
                body: null,
                message: "No clinicians found"
            });
        }

        // Calculate distance for each clinician, checking if address exists
        const distances = clinisists
            .filter(clinisist => clinisist.address && clinisist.address.latitude && clinisist.address.longitude) // Ensure valid address
            .map(clinisist => ({
                clinisist,
                distance: calculateDistance(latitude, longitude, clinisist.address.latitude, clinisist.address.longitude)
            }));

        if (distances.length === 0) {
            return res.status(404).json({
                status: "error",
                body: null,
                message: "No clinicians with valid location found"
            });
        }

        // Find the nearest clinician(s)
        const minDistance = Math.min(...distances.map(d => d.distance));
        const nearestClinisists = distances.filter(d => d.distance === minDistance);

        // Choose one clinician randomly if there are multiple with the same distance
        const nearest = nearestClinisists[Math.floor(Math.random() * nearestClinisists.length)];

        // Populate the alert data
        const newAlert = new Alert({
            patient_name,
            patient_mobile_num,
            patient_location,
            distance: nearest.distance.toFixed(2), // Round to 2 decimal places
            nearest_clinisist_name: nearest.clinisist.name,
            nearest_clinisist_id: nearest.clinisist._id,
            nearest_clinisist_location: {
                latitude: nearest.clinisist.address.latitude,
                longitude: nearest.clinisist.address.longitude
            }
        });

        // Save the alert to the database
        await newAlert.save();

        // Send notifications
        await createNotification(
            patient_id, 
            'Patient', 
            'An alert has been triggered for your current location. Nearest clinician notified.', 
            nearest.clinisist._id, 
            'Clinisist', 
            'alert'
        );

        await createNotification(
            nearest.clinisist._id, 
            'Clinisist', 
            `An alert has been triggered by ${patient_name}. Please respond immediately.`,
            patient_id, 
            'Patient', 
            'alert'
        );

        // Prepare the additional alert message
        const alertMessage = {
            warning: "Suicidal thoughts and behavior are common with some mental illnesses. If you think you may hurt yourself or attempt suicide, get help right away:",
            steps: [
                "Call 911 or your local emergency number immediately.",
                "Call your mental health specialist.",
                "Call a suicide hotline number. In the U.S., call the National Suicide Prevention Lifeline at 1-800-273-TALK (1-800-273-8255) or use its webchat on suicidepreventionlifeline.org/chat.",
                "Seek help from your primary care provider.",
                "Reach out to a close friend or loved one.",
                "Contact a minister, spiritual leader, or someone else in your faith community."
            ]
        };

        // Send response with the alert and message
        res.status(201).json({
            status: "success",
            body: { newAlert, alertMessage },
            message: "Alert created and notifications sent successfully"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            body: null,
            message: err.message
        });
    }
};

module.exports = {
    createAlert
};
