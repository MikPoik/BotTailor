import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { Request } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

// Initialize S3 client for Google Cloud Storage
const s3Client = new S3Client({
  endpoint: "https://storage.googleapis.com",
  region: "auto", // GCS S3 interop uses "auto" region
  credentials: {
    accessKeyId: process.env.GCP_ACCESS_KEY_ID!,
    secretAccessKey: process.env.GCP_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

const bucketName = process.env.GCP_BUCKET_NAME || "chatbot-avatars";

// Initialize the client with a default bucket if needed
let isClientInitialized = false;

async function ensureClientInitialized() {
  if (!isClientInitialized) {
    try {
      // Check required environment variables
      if (!process.env.GCP_ACCESS_KEY_ID || !process.env.GCP_SECRET_ACCESS_KEY || !bucketName) {
        throw new Error("Missing required GCP environment variables: GCP_ACCESS_KEY_ID, GCP_SECRET_ACCESS_KEY, GCP_BUCKET_NAME");
      }
      
      // Test connectivity with a lightweight bucket check
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      isClientInitialized = true;
    } catch (error) {
      console.warn("GCP Storage not properly configured:", error);
      isClientInitialized = false;
    }
  }
  return isClientInitialized;
}

// Configure multer for memory storage
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// Configure multer for text file uploads
export const uploadTextFile = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for text files
  },
  fileFilter: (req, file, cb) => {
    // Allow text files and common document formats
    const allowedMimeTypes = [
      'text/plain',
      'text/csv',
      'text/markdown',
      'application/json',
      'application/xml',
      'text/xml'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('text/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadBackgroundImage(file: Express.Multer.File, userId: string): Promise<UploadResult> {
  try {
    // Check if GCP storage is available
    const isInitialized = await ensureClientInitialized();
    if (!isInitialized) {
      return {
        success: false,
        error: "GCP Storage is not configured. Please contact administrator."
      };
    }

    // Generate unique filename - always use .jpg since we convert to JPEG
    const fileName = `backgrounds/${userId}/${uuidv4()}.jpg`;

    // Process image with Sharp - optimize for chat widget background
    const processedImage = await sharp(file.buffer)
      .resize(800, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 60,
        progressive: true,
        mozjpeg: true
      })
      .toBuffer();

    // Upload to GCP Storage using S3 interface
    console.log(`Uploading ${fileName}, processed image size: ${processedImage.length} bytes`);
    
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: processedImage,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000' // 1 year cache
    });

    await s3Client.send(uploadCommand);
    
    console.log(`Upload successful: ${fileName}`);

    // Return the public URL for the uploaded file
    const publicUrl = `/api/storage/${fileName}`;
    
    return {
      success: true,
      url: publicUrl
    };

  } catch (error) {
    console.error("Background image upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown upload error"
    };
  }
}

export async function uploadAvatar(file: Express.Multer.File, userId: string): Promise<UploadResult> {
  try {
    // Check if GCP storage is available
    const isInitialized = await ensureClientInitialized();
    if (!isInitialized) {
      return {
        success: false,
        error: "GCP Storage is not configured. Please contact administrator."
      };
    }

    // Generate unique filename - always use .jpg since we convert to JPEG
    const fileName = `avatars/${userId}/${uuidv4()}.jpg`;

    // Process image with Sharp - resize to 200x200 and compress
    const processedImage = await sharp(file.buffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 85,
        progressive: true
      })
      .toBuffer();

    // Upload to GCP Storage using S3 interface
    console.log(`Uploading ${fileName}, processed image size: ${processedImage.length} bytes`);
    
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: processedImage,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000' // 1 year cache
    });

    await s3Client.send(uploadCommand);
    
    console.log(`Upload successful: ${fileName}`);

    // Return the public URL for the uploaded file
    const publicUrl = `/api/storage/${fileName}`;
    
    return {
      success: true,
      url: publicUrl
    };

  } catch (error) {
    console.error("Avatar upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown upload error"
    };
  }
}

export async function getFileFromStorage(fileName: string): Promise<{ success: boolean; data?: Buffer; error?: string; contentType?: string }> {
  try {
    // Check if GCP storage is available
    const isInitialized = await ensureClientInitialized();
    if (!isInitialized) {
      return {
        success: false,
        error: "GCP Storage is not configured"
      };
    }

    // Download the file using S3 interface
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });
    
    const response = await s3Client.send(getCommand);
    
    if (!response.Body) {
      return {
        success: false,
        error: "File not found"
      };
    }

    // Determine content type - prefer S3 metadata, fallback to file extension
    let contentType = response.ContentType || 'application/octet-stream';
    
    if (!response.ContentType) {
      const extension = fileName.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg';
          break;
        case 'png':
          contentType = 'image/png';
          break;
        case 'gif':
          contentType = 'image/gif';
          break;
        case 'webp':
          contentType = 'image/webp';
          break;
      }
    }

    // Convert stream to buffer
    const streamToBuffer = async (stream: any): Promise<Buffer> => {
      const chunks: Buffer[] = [];
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    };
    
    const data = await streamToBuffer(response.Body);
    
    console.log(`File ${fileName}: retrieved ${data.length} bytes`);

    return {
      success: true,
      data,
      contentType
    };

  } catch (error) {
    console.error("File retrieval error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown retrieval error"
    };
  }
}

export async function deleteFile(fileName: string): Promise<boolean> {
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });
    
    await s3Client.send(deleteCommand);
    return true;
  } catch (error) {
    console.error("File deletion error:", error);
    return false;
  }
}