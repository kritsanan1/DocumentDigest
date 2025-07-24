import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const citizens = pgTable("citizens", {
  id: serial("id").primaryKey(),
  thaiId: text("thai_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  isVerified: boolean("is_verified").default(false),
  biometricEnabled: boolean("biometric_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  citizenId: integer("citizen_id").references(() => citizens.id),
  serviceType: text("service_type").notNull(), // 'tax', 'permit', 'complaint', 'qr'
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'completed', 'rejected'
  trackingId: text("tracking_id").notNull().unique(),
  amount: integer("amount"), // in satang for tax payments
  documentUrls: jsonb("document_urls").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // 'finance', 'services', 'community'
  title: text("title").notNull(),
  data: jsonb("data").$type<Record<string, any>>().notNull(),
  year: integer("year").notNull(),
  month: integer("month"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // 'news', 'events', 'emergency'
  title: text("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  imageUrl: text("image_url"),
  priority: text("priority").notNull().default("normal"), // 'emergency', 'high', 'normal', 'low'
  isActive: boolean("is_active").default(true),
  publishedAt: timestamp("published_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  citizenId: integer("citizen_id").references(() => citizens.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // 'success', 'error', 'warning', 'info'
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const thaiIdVerifications = pgTable("thai_id_verifications", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().unique(),
  citizenId: integer("citizen_id").references(() => citizens.id),
  verificationMethod: text("verification_method").notNull(), // 'ndid', 'dopa', 'ekyc', 'thaid_app'
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'failed', 'expired'
  identityAssuranceLevel: text("identity_assurance_level").notNull().default("IAL1"), // 'IAL1', 'IAL2', 'IAL3'
  verifiedData: jsonb("verified_data").$type<Record<string, any>>(),
  biometricScore: integer("biometric_score"), // 0-100 score for biometric verification
  blockchainHash: text("blockchain_hash"), // For NDID blockchain verification
  dopaReferenceId: text("dopa_reference_id"), // For DOPA verification reference
  transactionId: text("transaction_id"), // External service transaction ID
  errorMessage: text("error_message"),
  verifiedAt: timestamp("verified_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertCitizenSchema = createInsertSchema(citizens).omit({
  id: true,
  createdAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  trackingId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertThaiIdVerificationSchema = createInsertSchema(thaiIdVerifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type Citizen = typeof citizens.$inferSelect;
export type InsertCitizen = z.infer<typeof insertCitizenSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type ThaiIdVerification = typeof thaiIdVerifications.$inferSelect;
export type InsertThaiIdVerification = z.infer<typeof insertThaiIdVerificationSchema>;

// Relations
export const citizensRelations = relations(citizens, ({ many }) => ({
  services: many(services),
  notifications: many(notifications),
  verifications: many(thaiIdVerifications),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  citizen: one(citizens, {
    fields: [services.citizenId],
    references: [citizens.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  citizen: one(citizens, {
    fields: [notifications.citizenId],
    references: [citizens.id],
  }),
}));

export const thaiIdVerificationsRelations = relations(thaiIdVerifications, ({ one }) => ({
  citizen: one(citizens, {
    fields: [thaiIdVerifications.citizenId],
    references: [citizens.id],
  }),
}));
