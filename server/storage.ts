import { 
  citizens, services, reports, announcements, notifications, thaiIdVerifications,
  type Citizen, type InsertCitizen, 
  type Service, type InsertService,
  type Report, type InsertReport,
  type Announcement, type InsertAnnouncement,
  type Notification, type InsertNotification,
  type ThaiIdVerification, type InsertThaiIdVerification
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Citizens
  getCitizen(id: number): Promise<Citizen | undefined>;
  getCitizenByThaiId(thaiId: string): Promise<Citizen | undefined>;
  createCitizen(citizen: InsertCitizen): Promise<Citizen>;
  updateCitizen(id: number, updates: Partial<Citizen>): Promise<Citizen | undefined>;

  // Services
  getService(id: number): Promise<Service | undefined>;
  getServicesByCitizen(citizenId: number): Promise<Service[]>;
  getServiceByTrackingId(trackingId: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, updates: Partial<Service>): Promise<Service | undefined>;
  getServiceStats(): Promise<Record<string, number>>;

  // Reports
  getReports(category?: string, year?: number): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;

  // Announcements
  getAnnouncements(category?: string, limit?: number): Promise<Announcement[]>;
  getAnnouncement(id: number): Promise<Announcement | undefined>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;

  // Notifications
  getNotificationsByCitizen(citizenId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;

  // Thai ID Verifications
  getThaiIdVerification(requestId: string): Promise<ThaiIdVerification | undefined>;
  getThaiIdVerificationHistory(citizenId: number): Promise<ThaiIdVerification[]>;
  createThaiIdVerification(verification: InsertThaiIdVerification): Promise<ThaiIdVerification>;
  updateThaiIdVerification(requestId: string, updates: Partial<ThaiIdVerification>): Promise<ThaiIdVerification | undefined>;
}

export class MemStorage implements IStorage {
  private citizens: Map<number, Citizen>;
  private services: Map<number, Service>;
  private reports: Map<number, Report>;
  private announcements: Map<number, Announcement>;
  private notifications: Map<number, Notification>;
  private currentCitizenId: number;
  private currentServiceId: number;
  private currentReportId: number;
  private currentAnnouncementId: number;
  private currentNotificationId: number;

  constructor() {
    this.citizens = new Map();
    this.services = new Map();
    this.reports = new Map();
    this.announcements = new Map();
    this.notifications = new Map();
    this.currentCitizenId = 1;
    this.currentServiceId = 1;
    this.currentReportId = 1;
    this.currentAnnouncementId = 1;
    this.currentNotificationId = 1;

    this.initializeData();
  }

  private initializeData() {
    // Initialize with the specific user from requirements
    const defaultCitizen: Citizen = {
      id: 1,
      thaiId: "1234567890123",
      firstName: "กฤษนันทน์",
      lastName: "นำแปง",
      address: "123 ถ.ราชดำเนิน แขวงบางขุนพรหม เขตพระนคร กทม. 10200",
      phone: "0812345678",
      email: "krissanant@example.com",
      isVerified: true,
      biometricEnabled: false,
      createdAt: new Date(),
    };
    this.citizens.set(1, defaultCitizen);
    this.currentCitizenId = 2;

    // Initialize sample announcements
    const sampleAnnouncements: Announcement[] = [
      {
        id: 1,
        category: "emergency",
        title: "แจ้งเตือนเร่งด่วน",
        content: "พบน้ำท่วมในพื้นที่ ถ.ราชดำเนิน กรุณาหลีกเลี่ยงการเดินทางในบริเวณดังกล่าว",
        summary: "พบน้ำท่วมในพื้นที่ ถ.ราชดำเนิน กรุณาหลีกเลี่ยง",
        imageUrl: null,
        priority: "emergency",
        isActive: true,
        publishedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        id: 2,
        category: "news",
        title: "ประชุมประชาคมหมู่บ้าน ครั้งที่ 1/2567",
        content: "เชิญชาวบ้านร่วมประชุมหารือเรื่องการพัฒนาท้องถิ่น วันที่ 25 มกราคม 2567 เวลา 19:00 น. ณ ศาลาอเนกประสงค์หมู่บ้าน",
        summary: "เชิญชาวบ้านร่วมประชุมหารือเรื่องการพัฒนาท้องถิ่น วันที่ 25 มกราคม 2567 เวลา 19:00 น.",
        imageUrl: "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600",
        priority: "normal",
        isActive: true,
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 3,
        category: "events",
        title: "งานเทศกาลลอยกระทง ประจำปี 2567",
        content: "ร่วมสืบสานประเพณีไทย ณ สวนสาธารณะกลางเมือง วันที่ 27 พฤศจิกายน 2567 เวลา 18:00-22:00 น.",
        summary: "ร่วมสืบสานประเพณีไทย ณ สวนสาธารณะกลางเมือง วันที่ 27 พฤศจิกายน 2567",
        imageUrl: null,
        priority: "normal",
        isActive: true,
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      }
    ];

    sampleAnnouncements.forEach(announcement => {
      this.announcements.set(announcement.id, announcement);
    });
    this.currentAnnouncementId = 4;

    // Initialize sample services
    const sampleServices: Service[] = [
      {
        id: 1,
        citizenId: 1,
        serviceType: "tax",
        title: "ชำระภาษีบ้านและที่ดิน",
        description: "ชำระภาษีบ้านและที่ดิน ประจำปี 2567",
        status: "completed",
        trackingId: "TAX-2024-001",
        amount: 150000, // 1,500 baht in satang
        documentUrls: [],
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: 2,
        citizenId: 1,
        serviceType: "permit",
        title: "ขออนุญาตก่อสร้าง",
        description: "ขออนุญาตก่อสร้างบ้านพักอาศัย",
        status: "processing",
        trackingId: "PER-2024-001",
        amount: null,
        documentUrls: [],
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      }
    ];

    sampleServices.forEach(service => {
      this.services.set(service.id, service);
    });
    this.currentServiceId = 3;

    // Initialize sample reports
    const currentYear = new Date().getFullYear();
    const sampleReports: Report[] = [
      {
        id: 1,
        category: "finance",
        title: "รายงานการเงิน ประจำปี 2567",
        data: {
          income: 2400000,
          expenses: 1800000,
          balance: 600000,
          breakdown: {
            tax_revenue: 1800000,
            government_budget: 600000,
            personnel_costs: 900000,
            infrastructure: 600000,
            utilities: 300000
          }
        },
        year: currentYear,
        month: null,
        createdAt: new Date(),
      },
      {
        id: 2,
        category: "services",
        title: "สถิติการใช้บริการ ประจำปี 2567",
        data: {
          total_services: 587,
          tax_payments: 342,
          permits: 156,
          complaints: 89,
          completion_rate: 0.85,
          satisfaction_score: 4.2
        },
        year: currentYear,
        month: null,
        createdAt: new Date(),
      }
    ];

    sampleReports.forEach(report => {
      this.reports.set(report.id, report);
    });
    this.currentReportId = 3;
  }

  // Citizens
  async getCitizen(id: number): Promise<Citizen | undefined> {
    return this.citizens.get(id);
  }

  async getCitizenByThaiId(thaiId: string): Promise<Citizen | undefined> {
    return Array.from(this.citizens.values()).find(citizen => citizen.thaiId === thaiId);
  }

  async createCitizen(insertCitizen: InsertCitizen): Promise<Citizen> {
    const id = this.currentCitizenId++;
    const citizen: Citizen = {
      ...insertCitizen,
      id,
      email: insertCitizen.email || null,
      isVerified: insertCitizen.isVerified || false,
      biometricEnabled: insertCitizen.biometricEnabled || false,
      createdAt: new Date(),
    };
    this.citizens.set(id, citizen);
    return citizen;
  }

  async updateCitizen(id: number, updates: Partial<Citizen>): Promise<Citizen | undefined> {
    const citizen = this.citizens.get(id);
    if (!citizen) return undefined;

    const updatedCitizen = { ...citizen, ...updates };
    this.citizens.set(id, updatedCitizen);
    return updatedCitizen;
  }

  // Services
  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async getServicesByCitizen(citizenId: number): Promise<Service[]> {
    return Array.from(this.services.values())
      .filter(service => service.citizenId === citizenId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getServiceByTrackingId(trackingId: string): Promise<Service | undefined> {
    return Array.from(this.services.values()).find(service => service.trackingId === trackingId);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = this.currentServiceId++;
    const trackingId = `${insertService.serviceType.toUpperCase()}-${new Date().getFullYear()}-${id.toString().padStart(3, '0')}`;
    const service: Service = {
      ...insertService,
      id,
      trackingId,
      description: insertService.description || null,
      status: insertService.status || "pending",
      citizenId: insertService.citizenId || null,
      amount: insertService.amount || null,
      documentUrls: insertService.documentUrls || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.services.set(id, service);
    return service;
  }

  async updateService(id: number, updates: Partial<Service>): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;

    const updatedService = { ...service, ...updates, updatedAt: new Date() };
    this.services.set(id, updatedService);
    return updatedService;
  }

  async getServiceStats(): Promise<Record<string, number>> {
    const services = Array.from(this.services.values());
    return {
      total: services.length,
      tax: services.filter(s => s.serviceType === 'tax').length,
      permit: services.filter(s => s.serviceType === 'permit').length,
      complaint: services.filter(s => s.serviceType === 'complaint').length,
      qr: services.filter(s => s.serviceType === 'qr').length,
      pending: services.filter(s => s.status === 'pending').length,
      processing: services.filter(s => s.status === 'processing').length,
      completed: services.filter(s => s.status === 'completed').length,
    };
  }

  // Reports
  async getReports(category?: string, year?: number): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter(report => (!category || report.category === category) && (!year || report.year === year))
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = this.currentReportId++;
    const report: Report = {
      ...insertReport,
      id,
      month: insertReport.month || null,
      createdAt: new Date(),
    };
    this.reports.set(id, report);
    return report;
  }

  // Announcements
  async getAnnouncements(category?: string, limit?: number): Promise<Announcement[]> {
    let announcements = Array.from(this.announcements.values())
      .filter(announcement => announcement.isActive && (!category || announcement.category === category))
      .sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0));

    if (limit) {
      announcements = announcements.slice(0, limit);
    }

    return announcements;
  }

  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    return this.announcements.get(id);
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const id = this.currentAnnouncementId++;
    const announcement: Announcement = {
      ...insertAnnouncement,
      id,
      summary: insertAnnouncement.summary || null,
      imageUrl: insertAnnouncement.imageUrl || null,
      priority: insertAnnouncement.priority || "normal",
      isActive: insertAnnouncement.isActive ?? true,
      publishedAt: insertAnnouncement.publishedAt || new Date(),
      createdAt: new Date(),
    };
    this.announcements.set(id, announcement);
    return announcement;
  }

  // Notifications
  async getNotificationsByCitizen(citizenId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.citizenId === citizenId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const notification: Notification = {
      ...insertNotification,
      id,
      type: insertNotification.type || "info",
      citizenId: insertNotification.citizenId || null,
      isRead: insertNotification.isRead ?? false,
      createdAt: new Date(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.isRead = true;
      this.notifications.set(id, notification);
    }
  }

  // Thai ID Verifications - Stub implementations for MemStorage
  async getThaiIdVerification(_requestId: string): Promise<ThaiIdVerification | undefined> {
    return undefined;
  }

  async getThaiIdVerificationHistory(_citizenId: number): Promise<ThaiIdVerification[]> {
    return [];
  }

  async createThaiIdVerification(_verification: InsertThaiIdVerification): Promise<ThaiIdVerification> {
    throw new Error("Thai ID verification not supported in memory storage");
  }

  async updateThaiIdVerification(_requestId: string, _updates: Partial<ThaiIdVerification>): Promise<ThaiIdVerification | undefined> {
    return undefined;
  }
}

export class DatabaseStorage implements IStorage {
  async getCitizen(id: number): Promise<Citizen | undefined> {
    const [citizen] = await db.select().from(citizens).where(eq(citizens.id, id));
    return citizen || undefined;
  }

  async getCitizenByThaiId(thaiId: string): Promise<Citizen | undefined> {
    const [citizen] = await db.select().from(citizens).where(eq(citizens.thaiId, thaiId));
    return citizen || undefined;
  }

  async createCitizen(insertCitizen: InsertCitizen): Promise<Citizen> {
    const [citizen] = await db
      .insert(citizens)
      .values(insertCitizen)
      .returning();
    return citizen;
  }

  async updateCitizen(id: number, updates: Partial<Citizen>): Promise<Citizen | undefined> {
    const [citizen] = await db
      .update(citizens)
      .set(updates)
      .where(eq(citizens.id, id))
      .returning();
    return citizen || undefined;
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async getServicesByCitizen(citizenId: number): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.citizenId, citizenId))
      .orderBy(desc(services.createdAt));
  }

  async getServiceByTrackingId(trackingId: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.trackingId, trackingId));
    return service || undefined;
  }

  async createService(insertService: InsertService): Promise<Service> {
    // Generate tracking ID
    const trackingId = `${insertService.serviceType.toUpperCase()}-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    
    const [service] = await db
      .insert(services)
      .values({
        ...insertService,
        trackingId,
      })
      .returning();
    return service;
  }

  async updateService(id: number, updates: Partial<Service>): Promise<Service | undefined> {
    const [service] = await db
      .update(services)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return service || undefined;
  }

  async getServiceStats(): Promise<Record<string, number>> {
    const stats = await db
      .select({
        serviceType: services.serviceType,
        count: sql<number>`count(*)`,
      })
      .from(services)
      .groupBy(services.serviceType);

    const total = await db.select({ count: sql<number>`count(*)` }).from(services);
    
    const result: Record<string, number> = { total: total[0]?.count || 0 };
    stats.forEach(stat => {
      result[stat.serviceType] = stat.count;
    });
    
    return result;
  }

  async getReports(category?: string, year?: number): Promise<Report[]> {
    if (category && year) {
      return await db.select().from(reports)
        .where(and(eq(reports.category, category), eq(reports.year, year)))
        .orderBy(desc(reports.createdAt));
    } else if (category) {
      return await db.select().from(reports)
        .where(eq(reports.category, category))
        .orderBy(desc(reports.createdAt));
    } else if (year) {
      return await db.select().from(reports)
        .where(eq(reports.year, year))
        .orderBy(desc(reports.createdAt));
    }
    
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values(insertReport)
      .returning();
    return report;
  }

  async getAnnouncements(category?: string, limit?: number): Promise<Announcement[]> {
    if (category && limit) {
      return await db.select().from(announcements)
        .where(and(eq(announcements.isActive, true), eq(announcements.category, category)))
        .orderBy(desc(announcements.publishedAt))
        .limit(limit);
    } else if (category) {
      return await db.select().from(announcements)
        .where(and(eq(announcements.isActive, true), eq(announcements.category, category)))
        .orderBy(desc(announcements.publishedAt));
    } else if (limit) {
      return await db.select().from(announcements)
        .where(eq(announcements.isActive, true))
        .orderBy(desc(announcements.publishedAt))
        .limit(limit);
    }
    
    return await db.select().from(announcements)
      .where(eq(announcements.isActive, true))
      .orderBy(desc(announcements.publishedAt));
  }

  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    const [announcement] = await db.select().from(announcements).where(eq(announcements.id, id));
    return announcement || undefined;
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db
      .insert(announcements)
      .values(insertAnnouncement)
      .returning();
    return announcement;
  }

  async getNotificationsByCitizen(citizenId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.citizenId, citizenId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  // Thai ID Verifications
  async getThaiIdVerification(requestId: string): Promise<ThaiIdVerification | undefined> {
    const [verification] = await db
      .select()
      .from(thaiIdVerifications)
      .where(eq(thaiIdVerifications.requestId, requestId));
    return verification || undefined;
  }

  async getThaiIdVerificationHistory(citizenId: number): Promise<ThaiIdVerification[]> {
    return await db
      .select()
      .from(thaiIdVerifications)
      .where(eq(thaiIdVerifications.citizenId, citizenId))
      .orderBy(desc(thaiIdVerifications.createdAt));
  }

  async createThaiIdVerification(insertVerification: InsertThaiIdVerification): Promise<ThaiIdVerification> {
    const [verification] = await db
      .insert(thaiIdVerifications)
      .values(insertVerification)
      .returning();
    return verification;
  }

  async updateThaiIdVerification(requestId: string, updates: Partial<ThaiIdVerification>): Promise<ThaiIdVerification | undefined> {
    const [verification] = await db
      .update(thaiIdVerifications)
      .set(updates)
      .where(eq(thaiIdVerifications.requestId, requestId))
      .returning();
    return verification || undefined;
  }
}

export const storage = new DatabaseStorage();
