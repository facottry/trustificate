# Context
We are continuing the backend development for our SaaS platform, "Trustificate" (Node.js, Express, MongoDB). We need a robust solution to store the generated certificate PDFs and uploaded external credential documents. We are using Cloudflare R2 for our object storage.

# Objective
Please implement a storage service in the Node.js backend using the AWS SDK (which is fully compatible with Cloudflare R2) to handle file uploads and retrieval. The necessary Cloudflare API keys are already provided in the `.env` file.

# Environment Variables Expected
Assume the following variables are present in the `.env` file:
* `R2_ACCOUNT_ID`
* `R2_ACCESS_KEY`
* `R2_SECRET_KEY`
* `R2_BUCKET_NAME`
* `R2_PUBLIC_BASE_URL` (Optional: if we are serving files via a custom public domain)

# Step 1: Install Dependencies
* Install `@aws-sdk/client-s3` for the core S3 client operations.
* Install `@aws-sdk/s3-request-presigner` to generate secure, temporary URLs for private documents.

# Step 2: Create the Storage Service
Create a new utility file (e.g., `services/cloudflareR2Service.ts`) that initializes the S3 Client pointed at the Cloudflare R2 endpoint (`https://<CLOUDFLARE_ACCOUNT_ID>.r2.cloudflarestorage.com`). 

Implement and export the following functions:
1. `uploadCertificate(fileBuffer: Buffer, fileName: string, contentType: string)`: Uploads a generated PDF to the R2 bucket and returns the file key or public URL.
2. `getPresignedUrl(fileKey: string, expiresIn: number)`: Generates a temporary, secure URL for viewing a private document (useful for sensitive external certificates).
3. `deleteFile(fileKey: string)`: Removes a file from the bucket (used when a certificate is permanently deleted or overwritten).

# Step 3: Integrate with Controllers
Update the existing certificate generation controller (or external registry controller) to use this new service. 
* When a new certificate PDF is generated via our HTML-to-PDF logic, pass the resulting PDF buffer to `uploadCertificate`.
* Save the returned URL or file key to the `pdfUrl` or `pdfBucketPath` field in the MongoDB `Certificate` document.

# Execution Constraints
* Ensure the AWS SDK client is explicitly configured with `region: "auto"`, as required by Cloudflare R2.
* Use clean, strongly-typed TypeScript.
* Show the `cloudflareR2Service.ts` code first, followed by an example of how it is integrated into the certificate creation controller.