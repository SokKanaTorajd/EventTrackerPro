import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ParticipantStatusBadge, 
  BackgroundCheckStatusBadge 
} from "@/components/ui/status-badge";
import { AvatarWithFallback, getInitials } from "@/components/ui/avatar-with-fallback";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Check, X, AlertTriangle, Loader2 } from "lucide-react";
import { Participant, Event } from "@shared/schema";
import { format } from "date-fns";

export function ParticipantReview() {
  const [tab, setTab] = useState("pending");
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get pending participants that need review
  const { data: pendingParticipants, isLoading: pendingLoading } = useQuery<Participant[]>({
    queryKey: ["/api/stats/pending-reviews"],
  });

  // Get all events for context
  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const isLoading = pendingLoading || eventsLoading;

  const getEventName = (eventId: number) => {
    if (!events) return "Unknown Event";
    const event = events.find(e => e.id === eventId);
    return event ? event.name : "Unknown Event";
  };

  const loadEmailTemplate = async (participant: Participant, type: "approval" | "rejection") => {
    try {
      setSelectedParticipant(participant);
      
      // Get template matching the type
      const res = await fetch(`/api/email-templates?type=${type}`);
      const templates = await res.json();
      const template = templates.find((t: any) => t.isDefault) || templates[0];
      
      if (!template) {
        throw new Error(`No ${type} email template found`);
      }
      
      // Replace placeholders
      let content = template.body
        .replace(/{{firstName}}/g, participant.firstName)
        .replace(/{{lastName}}/g, participant.lastName)
        .replace(/{{eventName}}/g, getEventName(participant.eventId));
      
      setEmailContent(content);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load email template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (participant: Participant, status: string, sendEmail: boolean) => {
    setProcessingId(participant.id);
    try {
      // Update status
      await apiRequest("PUT", `/api/participants/${participant.id}`, { 
        status, 
        backgroundCheckStatus: "completed",
        notes: reviewNotes
      });

      if (sendEmail) {
        // Get template
        const type = status === "approved" ? "approval" : "rejection";
        const templateRes = await fetch(`/api/email-templates?type=${type}`);
        const templates = await templateRes.json();
        const template = templates.find((t: any) => t.isDefault) || templates[0];
        
        if (!template) {
          throw new Error(`No ${type} email template found`);
        }
        
        // Send email
        await apiRequest("POST", "/api/sent-emails", {
          templateId: template.id,
          participantId: participant.id,
          subject: template.subject,
          body: emailContent || template.body,
          sentById: 1 // Admin user ID
        });
      }
      
      toast({
        title: "Review completed",
        description: `Participant ${status} and ${sendEmail ? "email sent" : "no email sent"}.`,
      });
      
      // Reset state and refresh data
      setSelectedParticipant(null);
      setReviewNotes("");
      setEmailContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/stats/pending-reviews"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update participant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid place-items-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading participants...</p>
        </div>
      </div>
    );
  }

  const pendingCount = pendingParticipants?.filter(p => p.status === "pending").length || 0;
  const inReviewCount = pendingParticipants?.filter(p => p.status === "in_review").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Participant Reviews</h2>
          <p className="text-muted-foreground">
            Review and approve pending participants
          </p>
        </div>
        
        <Tabs value={tab} onValueChange={setTab} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 grid place-items-center">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="in_review" className="relative">
              In Review
              {inReviewCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 grid place-items-center">
                  {inReviewCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <TabsContent value="pending" className="m-0">
        {pendingParticipants?.filter(p => p.status === "pending").length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No pending participants</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingParticipants
              ?.filter(p => p.status === "pending")
              .map(participant => (
                <Card key={participant.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <AvatarWithFallback
                          alt={`${participant.firstName} ${participant.lastName}`}
                          fallback={getInitials(`${participant.firstName} ${participant.lastName}`)}
                        />
                        <div>
                          <CardTitle className="text-base">
                            {participant.firstName} {participant.lastName}
                          </CardTitle>
                          <CardDescription>
                            {participant.email}
                          </CardDescription>
                        </div>
                      </div>
                      {participant.previouslyApproved && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Previously Approved
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>This participant was approved in a previous event</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Event:</span>
                        <span className="font-medium">{getEventName(participant.eventId)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Company:</span>
                        <span className="font-medium">{participant.company || "N/A"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <ParticipantStatusBadge status={participant.status} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Background check:</span>
                        <BackgroundCheckStatusBadge status={participant.backgroundCheckStatus} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Registered:</span>
                        <span>
                          {participant.registeredAt 
                            ? format(new Date(participant.registeredAt), "MMM d, yyyy") 
                            : "N/A"}
                        </span>
                      </div>
                      
                      {participant.linkedInProfile && (
                        <div className="pt-2">
                          <a 
                            href={participant.linkedInProfile} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2 items-stretch">
                    <Button 
                      onClick={() => {
                        setSelectedParticipant(participant);
                        loadEmailTemplate(participant, "approval");
                      }}
                      className="w-full"
                    >
                      Start Review
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="in_review" className="m-0">
        {pendingParticipants?.filter(p => p.status === "in_review").length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No participants in review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingParticipants
              ?.filter(p => p.status === "in_review")
              .map(participant => (
                <Card key={participant.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <AvatarWithFallback
                          alt={`${participant.firstName} ${participant.lastName}`}
                          fallback={getInitials(`${participant.firstName} ${participant.lastName}`)}
                        />
                        <div>
                          <CardTitle className="text-base">
                            {participant.firstName} {participant.lastName}
                          </CardTitle>
                          <CardDescription>
                            {participant.email}
                          </CardDescription>
                        </div>
                      </div>
                      {participant.previouslyApproved && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Previously Approved
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>This participant was approved in a previous event</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Event:</span>
                        <span className="font-medium">{getEventName(participant.eventId)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Company:</span>
                        <span className="font-medium">{participant.company || "N/A"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <ParticipantStatusBadge status={participant.status} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Background check:</span>
                        <BackgroundCheckStatusBadge status={participant.backgroundCheckStatus} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Registered:</span>
                        <span>
                          {participant.registeredAt 
                            ? format(new Date(participant.registeredAt), "MMM d, yyyy") 
                            : "N/A"}
                        </span>
                      </div>
                      
                      {participant.linkedInProfile && (
                        <div className="pt-2">
                          <a 
                            href={participant.linkedInProfile} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between gap-2">
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedParticipant(participant);
                        loadEmailTemplate(participant, "rejection");
                      }}
                      disabled={processingId === participant.id}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                    <Button 
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setSelectedParticipant(participant);
                        loadEmailTemplate(participant, "approval");
                      }}
                      disabled={processingId === participant.id}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        )}
      </TabsContent>
      
      {selectedParticipant && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Review Participant</CardTitle>
            <CardDescription>
              {selectedParticipant.firstName} {selectedParticipant.lastName}
              {' - '}
              {getEventName(selectedParticipant.eventId)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Review Notes</h3>
              <Textarea
                placeholder="Add your review notes here..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="min-h-24"
              />
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Email Preview</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  Email will be sent on approval/rejection
                </div>
              </div>
              
              <div className="border rounded-md p-4 bg-muted/20">
                <div><strong>To:</strong> {selectedParticipant.email}</div>
                <div className="mt-2">
                  <strong>Subject:</strong> {selectedParticipant.status === "approved" 
                    ? "Your registration has been approved" 
                    : "Regarding your event registration"}
                </div>
                <div className="mt-4 whitespace-pre-wrap">{emailContent}</div>
              </div>
              
              <Textarea
                placeholder="Customize email content..."
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                className="min-h-32"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedParticipant(null);
                setReviewNotes("");
                setEmailContent("");
              }}
              disabled={processingId === selectedParticipant.id}
            >
              Cancel
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => handleStatusUpdate(selectedParticipant, "rejected", true)}
                disabled={processingId === selectedParticipant.id}
              >
                {processingId === selectedParticipant.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Reject & Send Email
              </Button>
              
              <Button
                variant="default"
                onClick={() => handleStatusUpdate(selectedParticipant, "approved", true)}
                disabled={processingId === selectedParticipant.id}
              >
                {processingId === selectedParticipant.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Approve & Send Email
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
