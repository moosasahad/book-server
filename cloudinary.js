require("dotenv").config();
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The buffer of the file to upload.
 * @param {string} originalName - The original name of the file.
 * @returns {Promise<object>} - Resolves with the Cloudinary upload result.
 */
const uploadToCloudinary = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    let publicId = undefined;
    if (originalName) {
      // Remove extension and replace non-alphanumeric chars with dashes
      const nameWithoutExtension = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
      publicId = nameWithoutExtension
        .replace(/[^a-zA-Z0-9]/g, "-")
        .toLowerCase() + "-" + Date.now();
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "booking-demo",
        resource_type: "auto", // Automatically detect the file type (image, video, raw)
        public_id: publicId,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
};
