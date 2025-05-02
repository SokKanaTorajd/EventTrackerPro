import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users (admin users of the system)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("admin"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Events
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  location: text("location"),
  maxParticipants: integer("max_participants"),
  status: text("status").notNull().default("draft"), // draft, active, completed, cancelled
  formFields: jsonb("form_fields").notNull(), // Array of field objects { id, name, type, required, options }
  createdById: integer("created_by_id").notNull(),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Event Form Fields
export const formFieldTypes = ["text", "email", "select", "radio", "checkbox", "textarea"] as const;
export type FormFieldType = typeof formFieldTypes[number];

export const formFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(formFieldTypes),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
});

export type FormField = z.infer<typeof formFieldSchema>;

// Participants
export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  linkedInProfile: text("linkedin_profile"),
  gender: text("gender"),
  formData: jsonb("form_data"), // Additional form data from custom fields
  status: text("status").notNull().default("pending"), // pending, in_review, approved, rejected
  backgroundCheckStatus: text("background_check_status").notNull().default("not_started"), // not_started, in_progress, completed, not_required
  registeredAt: timestamp("registered_at").notNull().defaultNow(),
  notes: text("notes"),
  previouslyApproved: boolean("previously_approved").default(false),
});

export const insertParticipantSchema = createInsertSchema(participants).omit({ 
  id: true, 
  status: true, 
  backgroundCheckStatus: true, 
  registeredAt: true,
  previouslyApproved: true 
});
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Participant = typeof participants.$inferSelect;

// Email Templates
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull(), // approval, rejection, reminder, custom
  isDefault: boolean("is_default").default(false),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

// Sent Emails
export const sentEmails = pgTable("sent_emails", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  participantId: integer("participant_id").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  sentById: integer("sent_by_id").notNull(),
});

export const insertSentEmailSchema = createInsertSchema(sentEmails).omit({ 
  id: true, 
  sentAt: true 
});
export type InsertSentEmail = z.infer<typeof insertSentEmailSchema>;
export type SentEmail = typeof sentEmails.$inferSelect;
