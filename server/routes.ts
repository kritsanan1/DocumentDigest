import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertServiceSchema, insertNotificationSchema } from "@shared/schema";
import { z } from "zod";
import { 
  ThaiIdVerificationService, 
  VerificationRequestSchema,
  type VerificationRequest 
} from "./thai-id-verification";
import { v4 as uuidv4 } from "uuid";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const connectedClients = new Map<string, WebSocket>();

  wss.on('connection', (ws, req) => {
    const citizenId = req.url?.split('?citizenId=')[1];
    if (citizenId) {
      connectedClients.set(citizenId, ws);
    }

    ws.on('close', () => {
      if (citizenId) {
        connectedClients.delete(citizenId);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Helper function to send notifications
  const sendNotification = (citizenId: string, notification: any) => {
    const client = connectedClients.get(citizenId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(notification));
    }
  };

  // Citizens endpoints
  app.get("/api/citizens/current", async (req, res) => {
    try {
      // For demo purposes, return the default citizen
      const citizen = await storage.getCitizen(1);
      if (!citizen) {
        return res.status(404).json({ error: "Citizen not found" });
      }
      res.json(citizen);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch citizen" });
    }
  });

  app.patch("/api/citizens/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const citizen = await storage.updateCitizen(id, updates);
      if (!citizen) {
        return res.status(404).json({ error: "Citizen not found" });
      }
      
      res.json(citizen);
    } catch (error) {
      res.status(500).json({ error: "Failed to update citizen" });
    }
  });

  // Services endpoints
  app.get("/api/services", async (req, res) => {
    try {
      const citizenId = parseInt(req.query.citizenId as string) || 1;
      const services = await storage.getServicesByCitizen(citizenId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  app.get("/api/services/stats", async (req, res) => {
    try {
      const stats = await storage.getServiceStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service stats" });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service" });
    }
  });

  app.get("/api/services/track/:trackingId", async (req, res) => {
    try {
      const trackingId = req.params.trackingId;
      const service = await storage.getServiceByTrackingId(trackingId);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ error: "Failed to track service" });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      
      // Send real-time notification
      const notification = await storage.createNotification({
        citizenId: service.citizenId!,
        title: "คำขอใหม่",
        message: `คำขอ${service.title}ได้รับการส่งเรียบร้อยแล้ว รหัสติดตาม: ${service.trackingId}`,
        type: "success",
      });

      sendNotification(service.citizenId!.toString(), {
        type: 'notification',
        data: notification
      });

      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid service data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create service" });
      }
    }
  });

  app.patch("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const service = await storage.updateService(id, updates);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }

      // Send notification on status change
      if (updates.status && service.citizenId) {
        const statusMessages = {
          processing: "กำลังดำเนินการ",
          completed: "เสร็จสิ้น",
          rejected: "ถูกปฏิเสธ"
        };

        const message = statusMessages[updates.status as keyof typeof statusMessages];
        if (message) {
          const notification = await storage.createNotification({
            citizenId: service.citizenId,
            title: "อัพเดทสถานะ",
            message: `${service.title} - ${message}`,
            type: updates.status === 'completed' ? 'success' : updates.status === 'rejected' ? 'error' : 'info',
          });

          sendNotification(service.citizenId.toString(), {
            type: 'notification',
            data: notification
          });
        }
      }
      
      res.json(service);
    } catch (error) {
      res.status(500).json({ error: "Failed to update service" });
    }
  });

  // Reports endpoints
  app.get("/api/reports", async (req, res) => {
    try {
      const category = req.query.category as string;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      
      const reports = await storage.getReports(category, year);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  // Announcements endpoints
  app.get("/api/announcements", async (req, res) => {
    try {
      const category = req.query.category as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const announcements = await storage.getAnnouncements(category, limit);
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.get("/api/announcements/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const announcement = await storage.getAnnouncement(id);
      if (!announcement) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      res.json(announcement);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch announcement" });
    }
  });

  // Notifications endpoints
  app.get("/api/notifications", async (req, res) => {
    try {
      const citizenId = parseInt(req.query.citizenId as string) || 1;
      const notifications = await storage.getNotificationsByCitizen(citizenId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Thai ID Verification API Endpoints
  const verificationService = new ThaiIdVerificationService();

  // Initiate Thai ID verification with government databases
  app.post("/api/auth/thai-id/initiate", async (req, res) => {
    try {
      const parseResult = VerificationRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid request format", 
          details: parseResult.error.errors 
        });
      }

      const request: VerificationRequest = {
        ...parseResult.data,
        requestId: parseResult.data.requestId || uuidv4(),
      };

      // Store verification request in database
      await storage.createThaiIdVerification({
        requestId: request.requestId,
        citizenId: 1, // Current citizen for demo
        verificationMethod: request.method,
        status: 'pending',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });

      // Process verification based on method
      const result = await verificationService.verifyIdentity(request);

      if (result.success) {
        // Update verification record
        await storage.updateThaiIdVerification(request.requestId, {
          status: 'completed',
          identityAssuranceLevel: result.identityAssuranceLevel,
          verifiedData: result.verifiedData,
          biometricScore: result.biometricScore,
          blockchainHash: result.metadata?.blockchainHash,
          dopaReferenceId: result.metadata?.dopaReferenceId,
          transactionId: result.metadata?.transactionId,
          verifiedAt: new Date(),
        });

        // Send real-time notification
        const notification = await storage.createNotification({
          citizenId: 1,
          title: 'ยืนยันตัวตนสำเร็จ',
          message: `การยืนยันตัวตนผ่าน ${result.method.toUpperCase()} เสร็จสิ้นแล้ว`,
          type: 'success',
        });

        sendNotification('1', notification);
      } else {
        // Update verification record with error
        await storage.updateThaiIdVerification(request.requestId, {
          status: 'failed',
          errorMessage: result.errors?.join(', '),
        });
      }

      res.json(result);
    } catch (error) {
      console.error('Thai ID verification error:', error);
      res.status(500).json({ error: "Failed to initiate verification" });
    }
  });

  // Check verification status
  app.get("/api/auth/thai-id/status/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;
      const verification = await storage.getThaiIdVerification(requestId);
      
      if (!verification) {
        return res.status(404).json({ error: "Verification request not found" });
      }

      // Check if expired
      if (verification.expiresAt && new Date() > verification.expiresAt) {
        await storage.updateThaiIdVerification(requestId, { status: 'expired' });
        return res.json({ 
          success: false, 
          status: 'expired',
          message: 'Verification request has expired' 
        });
      }

      // For NDID, check real-time status
      if (verification.verificationMethod === 'ndid' && verification.status === 'pending') {
        const result = await verificationService.getVerificationStatus(requestId, 'ndid');
        if (result.success && result.verifiedData) {
          await storage.updateThaiIdVerification(requestId, {
            status: 'completed',
            verifiedData: result.verifiedData,
            verifiedAt: new Date(),
          });
        }
      }

      res.json({
        requestId: verification.requestId,
        status: verification.status,
        method: verification.verificationMethod,
        identityAssuranceLevel: verification.identityAssuranceLevel,
        verifiedData: verification.verifiedData,
        biometricScore: verification.biometricScore,
        verifiedAt: verification.verifiedAt,
        expiresAt: verification.expiresAt,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check verification status" });
    }
  });

  // Generate ThaID app deep link
  app.post("/api/auth/thai-id/deeplink", async (req, res) => {
    try {
      const { citizenId, requestId } = req.body;
      if (!citizenId || !requestId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const deepLink = verificationService.generateThaIdDeepLink(requestId, citizenId);
      const qrData = verificationService.generateQRCodeData(requestId, 'thaid_app');

      res.json({
        success: true,
        deepLink,
        qrData,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate deep link" });
    }
  });

  // NDID callback endpoint
  app.post("/api/auth/ndid/callback", async (req, res) => {
    try {
      const { request_id, status, response_data, blockchain_hash } = req.body;
      
      if (status === 'completed') {
        await storage.updateThaiIdVerification(request_id, {
          status: 'completed',
          verifiedData: response_data,
          blockchainHash: blockchain_hash,
          verifiedAt: new Date(),
        });

        // Send notification
        const notification = await storage.createNotification({
          citizenId: 1,
          title: 'ยืนยันตัวตนผ่าน NDID สำเร็จ',
          message: 'การยืนยันตัวตนผ่านระบบ Blockchain สำเร็จแล้ว',
          type: 'success',
        });

        sendNotification('1', notification);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to process NDID callback" });
    }
  });

  // DOPA callback endpoint
  app.post("/api/auth/dopa/callback", async (req, res) => {
    try {
      const { request_id, verification_result, reference_id } = req.body;
      
      await storage.updateThaiIdVerification(request_id, {
        status: verification_result.status === 'verified' ? 'completed' : 'failed',
        verifiedData: verification_result.citizen_data,
        dopaReferenceId: reference_id,
        verifiedAt: new Date(),
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to process DOPA callback" });
    }
  });

  // ThaID app callback endpoint
  app.post("/api/auth/thaid/callback", async (req, res) => {
    try {
      const { request_id, verification_data, status } = req.body;
      
      await storage.updateThaiIdVerification(request_id, {
        status: status === 'success' ? 'completed' : 'failed',
        verifiedData: verification_data,
        verifiedAt: new Date(),
      });

      // Send notification
      if (status === 'success') {
        const notification = await storage.createNotification({
          citizenId: 1,
          title: 'ยืนยันตัวตนผ่าน ThaID สำเร็จ',
          message: 'การยืนยันตัวตนผ่านแอป ThaID สำเร็จแล้ว',
          type: 'success',
        });

        sendNotification('1', notification);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to process ThaID callback" });
    }
  });

  // Get verification history
  app.get("/api/auth/thai-id/history", async (req, res) => {
    try {
      const citizenId = parseInt(req.query.citizenId as string) || 1;
      const verifications = await storage.getThaiIdVerificationHistory(citizenId);
      res.json(verifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch verification history" });
    }
  });

  // Utility endpoint for basic Thai ID validation
  app.post("/api/thai-id/validate", async (req, res) => {
    try {
      const { thaiId } = req.body;
      if (!thaiId || thaiId.length !== 13) {
        return res.status(400).json({ error: "Invalid Thai ID format" });
      }

      // Thai ID checksum validation
      const digits = thaiId.split('').map(Number);
      const sum = digits.slice(0, 12).reduce((acc: number, digit: number, index: number) => acc + digit * (13 - index), 0);
      const checksum = (11 - (sum % 11)) % 10;
      const isValid = checksum === digits[12];

      res.json({ 
        valid: isValid, 
        thaiId: isValid ? thaiId : null,
        message: isValid ? 'Valid Thai ID format' : 'Invalid Thai ID checksum'
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to validate Thai ID" });
    }
  });

  app.post("/api/qr/generate", async (req, res) => {
    try {
      const { serviceType, amount, description } = req.body;
      
      // Create a QR service request
      const service = await storage.createService({
        citizenId: 1, // Default citizen for demo
        serviceType: 'qr',
        title: `QR Payment - ${serviceType}`,
        description: description || `QR Code payment for ${serviceType}`,
        amount: amount ? parseInt(amount) : null,
      });

      // Generate QR data (simplified)
      const qrData = {
        trackingId: service.trackingId,
        amount: service.amount,
        description: service.description,
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      res.json({ qrData, service });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate QR code" });
    }
  });

  return httpServer;
}
