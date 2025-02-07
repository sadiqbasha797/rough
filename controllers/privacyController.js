const PrivacyPolicy = require('../models/privacy');
const Patient = require('../models/patient');
const moment = require('moment');

const updatePrivacy = async (req, res) => {
    try {
        const patientId = req.patient._id; // Assuming patientId is set by middleware
        const { privacy } = req.body;

        if (!privacy) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Privacy field is required'
            });
        }

        // Find the patient and update their privacy field
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Patient not found'
            });
        }

        patient.privacy = privacy;

        // Save the updated patient record
        await patient.save();

        res.json({
            status: 'success',
            body: patient,
            message: 'Privacy field updated successfully'
        });
    } catch (error) {
        console.error('Error updating privacy field:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while updating the privacy field',
            error: error.message
        });
    }
};


const createPrivacyPolicy = async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Title and content are required'
            });
        }

        const privacyPolicy = new PrivacyPolicy({ title, content });
        const createdPolicy = await privacyPolicy.save();

        res.status(201).json({
            status: 'success',
            body: createdPolicy,
            message: 'Privacy policy created successfully'
        });
    } catch (error) {
        console.error('Error creating privacy policy:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while creating the privacy policy',
            error: error.message
        });
    }
};

const updatePrivacyPolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Title and content are required'
            });
        }

        const privacyPolicy = await PrivacyPolicy.findByIdAndUpdate(id, { title, content, updatedAt: Date.now() }, { new: true });
        if (!privacyPolicy) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Privacy policy not found'
            });
        }

        res.json({
            status: 'success',
            body: privacyPolicy,
            message: 'Privacy policy updated successfully'
        });
    } catch (error) {
        console.error('Error updating privacy policy:', error);
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'An error occurred while updating the privacy policy',
            error: error.message
        });
    }
};

const getPrivacyPolicy = async (req, res) => {
    try {
        // Retrieve the latest privacy policy
        const privacyPolicy = await PrivacyPolicy.findOne().sort({ updatedAt: -1 });

        if (!privacyPolicy) {
            return res.status(404).send('<h1>No Privacy Policy Found</h1>');
        }

        // Format the updatedAt field
        const formattedDate = moment(privacyPolicy.updatedAt).format('Do MMMM YYYY');

        res.send(`
            <html>
            <head>
                <title>Privacy Policy</title>
            </head>
            <body>
                <h2>Privacy Policy</h2>
                <p>This Privacy Policy governs the manner in which Ifeelincolor collects, uses, maintains, and discloses information collected from users (hereinafter referred to as "Users") of the Ifeelincolor mobile application (hereinafter referred to as "App").</p>

                <h2>1. Personal Information Collection</h2>
                <p>Ifeelincolor may collect basic information from Users in order to provide and improve our services. This information may include but is not limited to the individual's name, contact information, and professional details. The purpose of collecting this information is to set up your account and provide you with the necessary features of the application.</p>

                <h2>2. Location and Background Location Data</h2>
                <p>Ifeelincolor utilizes location and background location services when Users clock in and out through the App. This helps maintain a record of the User's working hours while they are within the allotted area.</p>  
                <p>Location information is securely stored and used solely for work-related purposes. By using the App, Users consent to the collection, storage, and use of their location information for the purposes stated in this Privacy Policy.</p>

                <h2>3. Data Usage and Storage</h2>
                <p>User data collected by Ifeelincolor is securely stored on servers. We utilize industry-standard security measures to protect User data from unauthorized access or disclosure. The collected data is used to provide the requested services, improve App functionality, and communicate with Users regarding updates, support, and other service-related matters.</p>
                <p>We use your personal information to provide you with the services and features of the Ifeelincolor application, including managing your daily schedules and leaves and tracking your working hours.</p>

                <h2>4. Third-Party Integration</h2>
                <p>Ifeelincolor may use third-party services to facilitate various aspects of the App's functionality and services. These third parties have their own privacy policies governing the use of data. We encourage Users to review the privacy policies of these third parties.</p>

                <h2>5. Data Sharing</h2>
                <p>Ifeelincolor does not sell, trade, or rent User information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners, trusted affiliates, and advertisers for the purposes outlined above.</p>
                <p>Access to your personal information is restricted to authorized personnel only. We regularly monitor and update our security systems to ensure the highest level of protection.</p>

                <h2>6. Compliance with Legal Requirements</h2>
                <p>Ifeelincolor may disclose User information if required by law or in response to valid legal requests by public authorities (e.g., a court or government agency).</p>

                <h2>7. Updates and Changes to the Privacy Policy</h2>
                <p>Ifeelincolor reserves the right to update this Privacy Policy at any time. Users are encouraged to check this page periodically for any changes. It is recommended to review the Privacy Policy for any changes regularly. By using the App, Users acknowledge and agree to review this Privacy Policy periodically.</p>

                <h2>8. Acceptance of the Privacy Policy</h2>
                <p>By downloading and using the Ifeelincolor App, Users signify their acceptance of this Privacy Policy. If a User does not agree to this policy, they should not use the App. Continued use of the App following the posting of changes to this policy will be deemed as acceptance of those changes.</p>

                <p>If you have any questions or concerns regarding this Privacy Policy, please contact us.</p>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send('<h1>An error occurred while retrieving the privacy policy</h1>');
    }
};


module.exports = { createPrivacyPolicy, updatePrivacyPolicy, getPrivacyPolicy, updatePrivacy };
