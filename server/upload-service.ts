import { Client } from "@replit/object-storage";
import sharp from "sharp";
import { Request } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

// Initialize Replit Object Storage client with specific bucket
const client = new Client({
  bucketName: "chatbot-avatars"
});

// Initialize the client with a default bucket if needed
let isClientInitialized = false;

async function ensureClientInitialized() {
  if (!isClientInitialized) {
    try {
      // Test if client works by attempting to list files
      await client.list();
      isClientInitialized = true;
    } catch (error) {
      console.warn("Object storage not properly configured:", error);
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
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadAvatar(file: Express.Multer.File, userId: string): Promise<UploadResult> {
  try {
    // Check if object storage is available
    const isInitialized = await ensureClientInitialized();
    if (!isInitialized) {
      return {
        success: false,
        error: "Object storage is not configured. Please contact administrator."
      };
    }

    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `avatars/${userId}/${uuidv4()}.${fileExtension}`;

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

    // Upload to Replit Object Storage
    const { ok: uploadOk, error: uploadError } = await client.uploadFromBytes(
      fileName,
      processedImage
    );

    if (!uploadOk) {
      console.error("Upload failed:", uploadError);
      return {
        success: false,
        error: "Failed to upload file to storage"
      };
    }

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
    // Check if object storage is available
    const isInitialized = await ensureClientInitialized();
    if (!isInitialized) {
      return {
        success: false,
        error: "Object storage is not configured"
      };
    }

    const { ok, value, error } = await client.downloadAsBytes(fileName);
    
    if (!ok) {
      return {
        success: false,
        error: error || "File not found"
      };
    }

    // Determine content type based on file extension
    const extension = fileName.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
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

    return {
      success: true,
      data: Buffer.from(value),
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
    const { ok } = await client.delete(fileName);
    return ok;
  } catch (error) {
    console.error("File deletion error:", error);
    return false;
  }
}