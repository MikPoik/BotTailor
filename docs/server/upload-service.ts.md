# Documentation for server/upload-service.ts

Initialize S3 client for Google Cloud Storage
Initialize the client with a default bucket if needed
Check required environment variables
Test connectivity with a lightweight bucket check
Configure multer for memory storage
Only allow image files
Configure multer for text file uploads
Allow text files and common document formats
Check if GCP storage is available
Generate unique filename - always use .jpg since we convert to JPEG
Process image with Sharp - optimize for chat widget background
Upload to GCP Storage using S3 interface
Return the public URL for the uploaded file
Check if GCP storage is available
Generate unique filename - always use .jpg since we convert to JPEG
Process image with Sharp - resize to 200x200 and compress
Upload to GCP Storage using S3 interface
Return the public URL for the uploaded file
Check if GCP storage is available
Download the file using S3 interface
Determine content type - prefer S3 metadata, fallback to file extension
Convert stream to buffer