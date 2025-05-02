import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EventForm } from "@/components/events/event-form";
import { ParticipantForm } from "@/components/participants/participant-form";
import { ParticipantList } from "@/components/participants/participant-list";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventStatusBadge } from "@/components/ui/status-badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Event } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardFooter,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  MapPin,
  Users,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

export default function EventDetailsPage() {
  const [, params] = useRoute<{ id: string }>("/events/:id");
  const eventId = parseInt(params?.id || "0");
  const [activeTab, setActiveTab] = useState("details");
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: event, isLoading } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
  });

  const handleDeleteEvent = async () => {
    if (!eventId) return;
    
    setIsDeleting(true);
    try {
      await apiRequest("DELETE", `/api/events/${eventId}`);
      
      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully.",
      });
      
      // Navigate to events list
      window.location.href = "/events";
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event. Please try again.",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Event Details">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout title="Event Not Found">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">The event you're looking for doesn't exist.</p>
              <Button asChild>
                <Link to="/events">Back to Events</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (showRegistrationForm) {
    return (
      <DashboardLayout title={`Register for ${event.name}`}>
        <div className="mb-4">
          <Button 
            variant="outline" 
            onClick={() => setShowRegistrationForm(false)}
          >
            Back to Event Details
          </Button>
        </div>
        <ParticipantForm eventId={eventId} formFields={event.formFields as any} />
      </DashboardLayout>
    );
  }

  const isEventActive = event.status === "active";

  return (
    <DashboardLayout title={event.name}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <EventStatusBadge status={event.status} />
          <span className="text-sm text-muted-foreground">
            Created on {format(new Date(event.startDate), "MMMM d, yyyy")}
          </span>
        </div>
        
        <div className="flex gap-2">
          {isEventActive && (
            <Button onClick={() => setShowRegistrationForm(true)}>
              Register for this Event
            </Button>
          )}
          
          <Link to={`/events/${eventId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Event
            </Button>
          </Link>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the event
                  and all associated participant data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteEvent}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="form">Registration Form</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>
                Basic information about the event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {event.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                  <p className="text-foreground whitespace-pre-wrap">{event.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-foreground">
                      {format(new Date(event.startDate), "MMMM d, yyyy")}
                      {event.endDate && (
                        ` - ${format(new Date(event.endDate), "MMMM d, yyyy")}`
                      )}
                    </p>
                  </div>
                </div>
                
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-foreground">{event.location}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Capacity</p>
                    <p className="text-foreground">
                      {event.maxParticipants 
                        ? `Limited to ${event.maxParticipants} participants` 
                        : "Unlimited participants"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            {!isEventActive && (
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  This event is not currently active. To enable registrations, change the status to "Active" in the edit page.
                </p>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="participants">
          <ParticipantList eventId={eventId} title={`Participants for ${event.name}`} showEventColumn={false} />
        </TabsContent>
        
        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>Registration Form Fields</CardTitle>
              <CardDescription>
                Fields that participants will see during registration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(event.formFields as any[])?.map((field, index) => (
                  <div key={field.id} className="border rounded-md p-4">
                    <div className="flex justify-between mb-2">
                      <p className="font-medium">{field.label}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                          {field.type}
                        </span>
                        {field.required && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {field.options && field.options.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">Options:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {field.options.map((option: string) => (
                            <span 
                              key={option} 
                              className="text-xs px-2 py-1 rounded-full bg-muted"
                            >
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline">
                <Link to={`/events/${eventId}/edit`}>
                  Edit Registration Form
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
