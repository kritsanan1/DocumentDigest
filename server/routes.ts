import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertServiceSchema, insertNotificationSchema } from "@shared/schema";
import { z } from "zod";

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

  // Utility endpoints
  app.post("/api/thai-id/verify", async (req, res) => {
    try {
      const { thaiId } = req.body;
      if (!thaiId || thaiId.length !== 13) {
        return res.status(400).json({ error: "Invalid Thai ID format" });
      }

      const citizen = await storage.getCitizenByThaiId(thaiId);
      if (!citizen) {
        return res.status(404).json({ error: "Citizen not found" });
      }

      res.json({ verified: true, citizen });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify Thai ID" });
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
