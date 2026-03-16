const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY,
  R2_SECRET_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_BASE_URL,
} = process.env;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_BUCKET_NAME) {
  throw new Error(
    'Missing required R2 configuration. Ensure R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY and R2_BUCKET_NAME are set in the environment.'
  );
}

const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const s3 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
  forcePathStyle: false,
});

/**
 * Uploads a file buffer to Cloudflare R2 and returns the stored key + public URL.
 *
 * @param {Buffer} fileBuffer
 * @param {string} fileName
 * @param {string} contentType
 * @returns {{ key: string; url: string }}
 */
async function uploadCertificate(fileBuffer, fileName, contentType) {
  const key = `${Date.now()}-${fileName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  const publicUrl = R2_PUBLIC_BASE_URL
    ? `${R2_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`
    : `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`;

  return { key, url: publicUrl };
}

/**
 * Generates a presigned URL for a private document in R2.
 *
 * @param {string} fileKey
 * @param {number} expiresIn Seconds until expiration (default: 300)
 */
async function getPresignedUrl(fileKey, expiresIn = 300) {
  const command = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: fileKey });
  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Deletes a file from R2.
 *
 * @param {string} fileKey
 */
async function deleteFile(fileKey) {
  await s3.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: fileKey }));
}

module.exports = { uploadCertificate, getPresignedUrl, deleteFile };
