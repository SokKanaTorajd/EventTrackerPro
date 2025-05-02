import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertEventSchema, 
  insertParticipantSchema, 
  insertEmailTemplateSchema, 
  insertSentEmailSchema,
  formFieldSchema
} from "@shared/schema";

// Helper function to validate request body
function validateBody<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.message}`);
  }
  return result.data;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, you would generate a JWT token here
      // For now, we'll just return the user without the password
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        user: userWithoutPassword,
        token: "sample-token-for-demo" // This would be a real JWT in production
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const userData = validateBody(insertUserSchema, req.body);
      const user = await storage.createUser(userData);
      
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Event routes
  app.get("/api/events", async (_req: Request, res: Response) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/events", async (req: Request, res: Response) => {
    try {
      // Validate form fields array separately
      const formFields = req.body.formFields || [];
      if (Array.isArray(formFields)) {
        formFields.forEach(field => {
          validateBody(formFieldSchema, field);
        });
      }
      
      const eventData = validateBody(insertEventSchema, req.body);
      const event = await storage.createEvent(eventData);
      
      res.status(201).json(event);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate form fields array separately if present
      const formFields = req.body.formFields;
      if (formFields && Array.isArray(formFields)) {
        formFields.forEach(field => {
          validateBody(formFieldSchema, field);
        });
      }
      
      const event = await storage.updateEvent(id, req.body);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEvent(id);
      
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Participant routes
  app.get("/api/participants", async (req: Request, res: Response) => {
    try {
      const eventId = req.query.eventId ? parseInt(req.query.eventId as string) : undefined;
      const status = req.query.status as string | undefined;
      
      let participants;
      
      if (eventId) {
        participants = await storage.getParticipantsByEvent(eventId);
        if (status) {
          participants = participants.filter(p => p.status === status);
        }
      } else {
        const filters: Record<string, any> = {};
        if (status) {
          filters.status = status;
        }
        participants = await storage.getParticipants(filters);
      }
      
      res.json(participants);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/participants/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const participant = await storage.getParticipant(id);
      
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }
      
      res.json(participant);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/participants", async (req: Request, res: Response) => {
    try {
      const participantData = validateBody(insertParticipantSchema, req.body);
      const participant = await storage.createParticipant(participantData);
      
      res.status(201).json(participant);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/participants/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const participant = await storage.updateParticipant(id, req.body);
      
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }
      
      res.json(participant);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/participants/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteParticipant(id);
      
      if (!success) {
        return res.status(404).json({ message: "Participant not found" });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Email template routes
  app.get("/api/email-templates", async (req: Request, res: Response) => {
    try {
      const type = req.query.type as string | undefined;
      const templates = await storage.getEmailTemplates(type);
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/email-templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getEmailTemplate(id);
      
      if (!template) {
        return res.status(404).json({ message: "Email template not found" });
      }
      
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/email-templates", async (req: Request, res: Response) => {
    try {
      const templateData = validateBody(insertEmailTemplateSchema, req.body);
      const template = await storage.createEmailTemplate(templateData);
      
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/email-templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.updateEmailTemplate(id, req.body);
      
      if (!template) {
        return res.status(404).json({ message: "Email template not found" });
      }
      
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/email-templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEmailTemplate(id);
      
      if (!success) {
        return res.status(404).json({ message: "Email template not found" });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Sent email routes
  app.get("/api/sent-emails", async (req: Request, res: Response) => {
    try {
      const participantId = req.query.participantId 
        ? parseInt(req.query.participantId as string) 
        : undefined;
      
      const emails = await storage.getSentEmails(participantId);
      res.json(emails);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sent-emails", async (req: Request, res: Response) => {
    try {
      const emailData = validateBody(insertSentEmailSchema, req.body);
      const email = await storage.createSentEmail(emailData);
      
      res.status(201).json(email);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Dashboard stats routes
  app.get("/api/stats/participants", async (_req: Request, res: Response) => {
    try {
      const stats = await storage.getParticipantStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/stats/events", async (_req: Request, res: Response) => {
    try {
      const stats = await storage.getEventStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/stats/recent-participants", async (_req: Request, res: Response) => {
    try {
      const participants = await storage.getRecentParticipants();
      res.json(participants);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/stats/upcoming-events", async (_req: Request, res: Response) => {
    try {
      const events = await storage.getUpcomingEvents();
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/stats/pending-reviews", async (_req: Request, res: Response) => {
    try {
      const participants = await storage.getPendingReviews();
      res.json(participants);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Endpoint to check if a participant's email has previous approvals
  app.get("/api/check-history", async (req: Request, res: Response) => {
    try {
      const email = req.query.email as string;
      
      if (!email) {
        return res.status(400).json({ message: "Email parameter is required" });
      }
      
      const previouslyApproved = await storage.checkParticipantHistory(email);
      res.json({ previouslyApproved });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
