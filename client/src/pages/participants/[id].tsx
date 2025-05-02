import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  ParticipantStatusBadge, 
  BackgroundCheckStatusBadge 
} from "@/components/ui/status-badge";
import { AvatarWithFallback, getInitials } from "@/components/ui/avatar-with-fallback";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Participant, Event } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { 
  ExternalLink, 
  Clock, 
  Calendar, 
  Mail, 
  Briefcase, 
  Loader2
} from "lucide-react";
import { format } from "date-fns";

export default function ParticipantDetailsPage() {
  const [, params] = useRoute<{ id: string }>("/participants/:id");
  const participantId = parseInt(params?.id || "0");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const { toast } = useToast();
  
  const { data: participant, isLoading: participantLoading } = useQuery<Participant>({
    queryKey: [`/api/participants/${participantId}`],
    enabled: !!participantId,
    onSuccess: (data) => {
      if (data.notes) {
        setNotes(data.notes);
      }
    },
  });
  
  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: [`/api/events/${participant?.eventId}`],
    enabled: !!participant?.eventId,
  });
  
  const { data: sentEmails, isLoading: emailsLoading } = useQuery<any[]>({
    queryKey: [`/api/sent-emails?participantId=${participantId}`],
    enabled: !!participantId,
  });
  
  const isLoading = participantLoading || eventLoading;

  const saveNotes = async () => {
    if (!participant) return;
    
    setIsSaving(true);
    try {
      await apiRequest("PUT", `/api/participants/${participantId}`, { notes });
      
      toast({
        title: "Notes saved",
        description: "Participant notes have been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Participant Details">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!participant) {
    return (
      <DashboardLayout title="Participant Not Found">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">The participant you're looking for doesn't exist.</p>
              <Button asChild>
                <Link to="/participants">Back to Participants</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Participant Details">
      <div className="mb-6">
        <Link to="/participants">
          <Button variant="outline">Back to Participants</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex justify-between">
                <div className="flex items-center gap-4">
                  <AvatarWithFallback
                    alt={`${participant.firstName} ${participant.lastName}`}
                    fallback={getInitials(`${participant.firstName} ${participant.lastName}`)}
                    className="h-16 w-16"
                  />
                  <div>
                    <CardTitle className="text-2xl">
                      {participant.firstName} {participant.lastName}
                    </CardTitle>
                    <CardDescription>
                      {participant.email}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <ParticipantStatusBadge status={participant.status} />
                  {participant.previouslyApproved && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Previously Approved
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Tabs defaultValue="info">
                <TabsList className="mb-4">
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="history">Email History</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Registered</p>
                        <p>
                          {participant.registeredAt 
                            ? format(new Date(participant.registeredAt), "MMMM d, yyyy") 
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Background Check</p>
                        <BackgroundCheckStatusBadge status={participant.backgroundCheckStatus} />
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p>{participant.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Company/Institution</p>
                        <p>{participant.company || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {participant.linkedInProfile && (
                    <div>
                      <Separator className="my-4" />
                      <div className="flex items-center">
                        <a 
                          href={participant.linkedInProfile} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          LinkedIn Profile
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {participant.formData && Object.keys(participant.formData).length > 0 && (
                    <div className="mt-4">
                      <Separator className="my-4" />
                      <h3 className="text-base font-medium mb-4">Additional Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(participant.formData).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">
                              {(event?.formFields as any[])?.find(f => f.id === key)?.label || key}:
                            </p>
                            <p>{value?.toString() || "N/A"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="history">
                  {emailsLoading ? (
                    <div className="py-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="mt-2 text-muted-foreground">Loading email history...</p>
                    </div>
                  ) : sentEmails?.length ? (
                    <div className="space-y-4">
                      {sentEmails.map((email, index) => (
                        <div key={email.id} className="border rounded-md p-4">
                          <div className="flex justify-between mb-2">
                            <h4 className="font-medium">{email.subject}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(email.sentAt), "MMMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                            {email.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">No emails have been sent to this participant yet.</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="notes">
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Add notes about this participant here..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[200px]"
                    />
                    <Button 
                      onClick={saveNotes} 
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Notes"
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardContent>
              {event ? (
                <div className="space-y-4">
                  <h3 className="font-medium">{event.name}</h3>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(event.startDate), "MMMM d, yyyy")}
                      {event.endDate && (
                        ` - ${format(new Date(event.endDate), "MMMM d, yyyy")}`
                      )}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <EventStatusBadge status={event.status} />
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Event information not available</p>
              )}
            </CardContent>
            <CardFooter>
              {event && (
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/events/${event.id}`}>
                    View Event Details
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full"
                asChild
              >
                <Link to={`/participants/review?focus=${participantId}`}>
                  Review Participant
                </Link>
              </Button>
              
              <Button 
                variant="outline"
                className="w-full"
                asChild
              >
                <Link to="/participants">
                  Back to Participants List
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
