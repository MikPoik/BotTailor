/**
 * HTTP endpoints for file upload initiation, presign, and completion.
 *
 * Responsibilities:
 * - Exposes API routes for direct, presigned, and multipart uploads (see docs/agents/storage.md).
 * - Returns concise JSON: success/failure, fileId, public url or uploadUrl/presigned data.
 * - Validates file size, MIME type, and extension; enforces security and operational constraints.
 *
 * Contracts & Edge Cases:
 * - All upload endpoints must match client contract for upload flows and response shapes.
 * - Presigned/multipart endpoints must handle CORS and required headers for provider uploads.
 * - Security: validate and scan untrusted uploads before making public; enforce size/type limits.
 * - All changes must preserve public/embed asset compatibility and follow CORS/security best practices.
 */
import type { Express } from "express";
import { upload, uploadAvatar, uploadBackgroundImage, getFileFromStorage } from "../upload-service";
import { isAuthenticated } from "../neonAuth";

// File upload routes
export function setupUploadRoutes(app: Express) {
  // Avatar upload
  app.post('/api/upload/avatar', isAuthenticated, upload.single('avatar'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.neonUser.id;
      const result = await uploadAvatar(req.file, userId);

      if (!result.success) {
        return res.status(500).json({ message: result.error });
      }

      res.json({ url: result.url });
    } catch (error) {
      console.error("Avatar upload error:", error);
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });

  // Background image upload
  app.post('/api/upload/background', isAuthenticated, upload.single('background'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.neonUser.id;
      const result = await uploadBackgroundImage(req.file, userId);

      if (!result.success) {
        return res.status(500).json({ message: result.error });
      }

      res.json({ url: result.url });
    } catch (error) {
      console.error("Background image upload error:", error);
      res.status(500).json({ message: "Failed to upload background image" });
    }
  });

  // Serve files from storage
  app.get('/api/storage/*', async (req, res) => {
    try {
      const fileName = (req.params as any)[0] || ''; // Get everything after /api/storage/
      const result = await getFileFromStorage(fileName);

      if (!result.success) {
        return res.status(404).json({ message: result.error });
      }

      // Set appropriate headers
      if (result.contentType) {
        res.setHeader('Content-Type', result.contentType);
      }
      
      // Set cache headers
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year

      res.send(result.data);
    } catch (error) {
      console.error("File serving error:", error);
      res.status(500).json({ message: "Failed to serve file" });
    }
  });
}