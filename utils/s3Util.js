const AWS = require('aws-sdk');

// Initialize the S3 client
const S3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

/**
 * Uploads a file to the specified S3 bucket
 * @param {Buffer} fileContent - The file content to upload
 * @param {String} key - The key (filename) for the uploaded file
 * @param {String} mimeType - The MIME type of the file
 * @returns {Promise<String>} - The URL of the uploaded file
 */
const uploadFile = async (fileContent, key, mimeType) => {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: mimeType,
        ACL: 'public-read', // Remove this line
    };

    const data = await S3.upload(params).promise();
    return data.Location;
};


/**
 * Deletes a file from the specified S3 bucket
 * @param {String} key - The key (filename) of the file to delete
 * @returns {Promise<void>}
 */
const deleteFile = async (key) => {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
    };

    await S3.deleteObject(params).promise();
};

/**
 * Gets a file's URL from the specified S3 bucket
 * @param {String} key - The key (filename) of the file
 * @returns {String} - The URL of the file
 */
const getFileUrl = (key) => {
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

module.exports = {
    uploadFile,
    deleteFile,
    getFileUrl,
};
