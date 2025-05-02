import { 
  users, type User, type InsertUser,
  events, type Event, type InsertEvent,
  participants, type Participant, type InsertParticipant,
  emailTemplates, type EmailTemplate, type InsertEmailTemplate,
  sentEmails, type SentEmail, type InsertSentEmail
} from "@shared/schema";

// Interface definition for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  getEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  // Participant operations
  getParticipant(id: number): Promise<Participant | undefined>;
  getParticipants(filters?: Partial<Participant>): Promise<Participant[]>;
  getParticipantsByEvent(eventId: number): Promise<Participant[]>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  updateParticipant(id: number, participant: Partial<Participant>): Promise<Participant | undefined>;
  deleteParticipant(id: number): Promise<boolean>;
  
  // Email template operations
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  getEmailTemplates(type?: string): Promise<EmailTemplate[]>;
  createEmailTemplate(emailTemplate: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, emailTemplate: Partial<EmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: number): Promise<boolean>;
  
  // Sent email operations
  getSentEmail(id: number): Promise<SentEmail | undefined>;
  getSentEmails(participantId?: number): Promise<SentEmail[]>;
  createSentEmail(sentEmail: InsertSentEmail): Promise<SentEmail>;
  
  // Special operations
  checkParticipantHistory(email: string): Promise<boolean>;
  getPendingReviews(): Promise<Participant[]>;
  getRecentParticipants(limit?: number): Promise<Participant[]>;
  getUpcomingEvents(limit?: number): Promise<Event[]>;
  getParticipantStats(): Promise<{total: number, approved: number, pending: number, rejected: number}>;
  getEventStats(): Promise<{total: number, active: number, draft: number, completed: number}>;
}

// In-memory implementation of storage
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private participants: Map<number, Participant>;
  private emailTemplates: Map<number, EmailTemplate>;
  private sentEmails: Map<number, SentEmail>;
  
  private userIdCounter: number;
  private eventIdCounter: number;
  private participantIdCounter: number;
  private emailTemplateIdCounter: number;
  private sentEmailIdCounter: number;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.participants = new Map();
    this.emailTemplates = new Map();
    this.sentEmails = new Map();
    
    this.userIdCounter = 1;
    this.eventIdCounter = 1;
    this.participantIdCounter = 1;
    this.emailTemplateIdCounter = 1;
    this.sentEmailIdCounter = 1;
    
    this.seedData();
  }
  
  // Seed initial data
  private seedData() {
    // Add a default admin user
    this.createUser({
      username: "admin",
      password: "password", // In a real app, this would be hashed
      email: "admin@example.com",
      name: "Admin User",
      role: "admin"
    });
    
    // Add default email templates
    this.createEmailTemplate({
      name: "Default Approval",
      subject: "Your registration has been approved",
      body: "Dear {{firstName}},\n\nWe're pleased to inform you that your registration for {{eventName}} has been approved. We look forward to seeing you at the event.\n\nBest regards,\nThe Event Team",
      type: "approval",
      isDefault: true,
      createdById: 1
    });
    
    this.createEmailTemplate({
      name: "Default Rejection",
      subject: "Regarding your event registration",
      body: "Dear {{firstName}},\n\nThank you for your interest in {{eventName}}. Unfortunately, we are unable to approve your registration at this time.\n\nBest regards,\nThe Event Team",
      type: "rejection",
      isDefault: true,
      createdById: 1
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }
  
  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }
  
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const event: Event = { ...insertEvent, id };
    this.events.set(id, event);
    return event;
  }
  
  async updateEvent(id: number, eventUpdate: Partial<Event>): Promise<Event | undefined> {
    const event = await this.getEvent(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...eventUpdate };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }
  
  // Participant operations
  async getParticipant(id: number): Promise<Participant | undefined> {
    return this.participants.get(id);
  }
  
  async getParticipants(filters?: Partial<Participant>): Promise<Participant[]> {
    let participants = Array.from(this.participants.values());
    
    if (filters) {
      participants = participants.filter(participant => {
        return Object.entries(filters).every(([key, value]) => {
          return participant[key as keyof Participant] === value;
        });
      });
    }
    
    return participants;
  }
  
  async getParticipantsByEvent(eventId: number): Promise<Participant[]> {
    return Array.from(this.participants.values()).filter(
      participant => participant.eventId === eventId
    );
  }
  
  async createParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    // Check if this participant has been previously approved in other events
    const previouslyApproved = await this.checkParticipantHistory(insertParticipant.email);
    
    const id = this.participantIdCounter++;
    const participant: Participant = { 
      ...insertParticipant, 
      id,
      status: previouslyApproved ? "approved" : "pending",
      backgroundCheckStatus: previouslyApproved ? "not_required" : "not_started",
      registeredAt: new Date(),
      previouslyApproved
    };
    
    this.participants.set(id, participant);
    return participant;
  }
  
  async updateParticipant(id: number, participantUpdate: Partial<Participant>): Promise<Participant | undefined> {
    const participant = await this.getParticipant(id);
    if (!participant) return undefined;
    
    const updatedParticipant = { ...participant, ...participantUpdate };
    this.participants.set(id, updatedParticipant);
    return updatedParticipant;
  }
  
  async deleteParticipant(id: number): Promise<boolean> {
    return this.participants.delete(id);
  }
  
  // Email template operations
  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    return this.emailTemplates.get(id);
  }
  
  async getEmailTemplates(type?: string): Promise<EmailTemplate[]> {
    let templates = Array.from(this.emailTemplates.values());
    
    if (type) {
      templates = templates.filter(template => template.type === type);
    }
    
    return templates;
  }
  
  async createEmailTemplate(insertEmailTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
    const id = this.emailTemplateIdCounter++;
    const emailTemplate: EmailTemplate = { 
      ...insertEmailTemplate, 
      id,
      createdAt: new Date()
    };
    
    this.emailTemplates.set(id, emailTemplate);
    return emailTemplate;
  }
  
  async updateEmailTemplate(id: number, templateUpdate: Partial<EmailTemplate>): Promise<EmailTemplate | undefined> {
    const template = await this.getEmailTemplate(id);
    if (!template) return undefined;
    
    const updatedTemplate = { ...template, ...templateUpdate };
    this.emailTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }
  
  async deleteEmailTemplate(id: number): Promise<boolean> {
    return this.emailTemplates.delete(id);
  }
  
  // Sent email operations
  async getSentEmail(id: number): Promise<SentEmail | undefined> {
    return this.sentEmails.get(id);
  }
  
  async getSentEmails(participantId?: number): Promise<SentEmail[]> {
    let emails = Array.from(this.sentEmails.values());
    
    if (participantId) {
      emails = emails.filter(email => email.participantId === participantId);
    }
    
    return emails.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }
  
  async createSentEmail(insertSentEmail: InsertSentEmail): Promise<SentEmail> {
    const id = this.sentEmailIdCounter++;
    const sentEmail: SentEmail = { 
      ...insertSentEmail, 
      id,
      sentAt: new Date()
    };
    
    this.sentEmails.set(id, sentEmail);
    return sentEmail;
  }
  
  // Special operations
  async checkParticipantHistory(email: string): Promise<boolean> {
    // Check if the participant with this email has been approved in any past event
    const existingParticipants = Array.from(this.participants.values()).filter(
      participant => participant.email === email && participant.status === "approved"
    );
    
    return existingParticipants.length > 0;
  }
  
  async getPendingReviews(): Promise<Participant[]> {
    return Array.from(this.participants.values()).filter(
      participant => participant.status === "pending" || participant.status === "in_review"
    );
  }
  
  async getRecentParticipants(limit: number = 10): Promise<Participant[]> {
    return Array.from(this.participants.values())
      .sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime())
      .slice(0, limit);
  }
  
  async getUpcomingEvents(limit: number = 5): Promise<Event[]> {
    const now = new Date();
    return Array.from(this.events.values())
      .filter(event => new Date(event.startDate) > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, limit);
  }
  
  async getParticipantStats(): Promise<{total: number, approved: number, pending: number, rejected: number}> {
    const participants = Array.from(this.participants.values());
    return {
      total: participants.length,
      approved: participants.filter(p => p.status === "approved").length,
      pending: participants.filter(p => p.status === "pending" || p.status === "in_review").length,
      rejected: participants.filter(p => p.status === "rejected").length
    };
  }
  
  async getEventStats(): Promise<{total: number, active: number, draft: number, completed: number}> {
    const evts = Array.from(this.events.values());
    return {
      total: evts.length,
      active: evts.filter(e => e.status === "active").length,
      draft: evts.filter(e => e.status === "draft").length,
      completed: evts.filter(e => e.status === "completed").length
    };
  }
}

export const storage = new MemStorage();
