import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { 
  ParticipantStatusBadge, 
  BackgroundCheckStatusBadge 
} from "@/components/ui/status-badge";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Mail, Check, X } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Participant, Event } from "@shared/schema";
import { format } from "date-fns";
import { AvatarWithFallback, getInitials } from "@/components/ui/avatar-with-fallback";
import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface ParticipantListProps {
  eventId?: number;
  title?: string;
  showEventColumn?: boolean;
}

export function ParticipantList({ 
  eventId, 
  title = "Participants", 
  showEventColumn = true
}: ParticipantListProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailContent, setEmailContent] = useState("");
  const [emailType, setEmailType] = useState<"approval" | "rejection">("approval");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get participants with optional event filter
  const { data: participants, isLoading: participantsLoading } = useQuery<Participant[]>({
    queryKey: eventId ? ["/api/participants", eventId] : ["/api/participants"],
    queryFn: async () => {
      const url = eventId 
        ? `/api/participants?eventId=${eventId}` 
        : "/api/participants";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch participants");
      return res.json();
    },
  });

  // Get events for showing event names
  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    enabled: showEventColumn,
  });

  const isLoading = participantsLoading || (showEventColumn && eventsLoading);

  const getEventName = (eventId: number) => {
    if (!events) return "Unknown Event";
    const event = events.find(e => e.id === eventId);
    return event ? event.name : "Unknown Event";
  };

  const handleStatusUpdate = async (id: number, status: string, backgroundCheckStatus?: string) => {
    try {
      await apiRequest("PUT", `/api/participants/${id}`, { 
        status, 
        ...(backgroundCheckStatus && { backgroundCheckStatus })
      });
      
      toast({
        title: "Status updated",
        description: `Participant status updated to ${status}.`,
      });
      
      // Refetch participants
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: ["/api/participants", eventId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async () => {
    if (!selectedParticipant) return;
    
    try {
      // Get template matching the type
      const templateRes = await fetch(`/api/email-templates?type=${emailType}`);
      const templates = await templateRes.json();
      const template = templates.find((t: any) => t.isDefault) || templates[0];
      
      if (!template) {
        throw new Error(`No ${emailType} email template found`);
      }
      
      // Create sent email record
      await apiRequest("POST", "/api/sent-emails", {
        templateId: template.id,
        participantId: selectedParticipant.id,
        subject: template.subject,
        body: emailContent || template.body,
        sentById: 1 // Admin user ID
      });
      
      // Update participant status
      const newStatus = emailType === "approval" ? "approved" : "rejected";
      await handleStatusUpdate(selectedParticipant.id, newStatus, "completed");
      
      toast({
        title: "Email sent",
        description: `${emailType === "approval" ? "Approval" : "Rejection"} email sent to ${selectedParticipant.firstName} ${selectedParticipant.lastName}.`,
      });
      
      setEmailDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send email. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadEmailTemplate = async (participantId: number, type: "approval" | "rejection") => {
    try {
      setEmailType(type);
      const participant = participants?.find(p => p.id === participantId);
      
      if (!participant) {
        throw new Error("Participant not found");
      }
      
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
      setEmailDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load email template. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Define table columns
  let columns: ColumnDef<Participant>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const firstName = row.original.firstName;
        const lastName = row.original.lastName;
        
        return (
          <div className="flex items-center space-x-3">
            <AvatarWithFallback
              alt={`${firstName} ${lastName}`}
              fallback={getInitials(`${firstName} ${lastName}`)}
            />
            <div>
              <div className="font-medium">{firstName} {lastName}</div>
              <div className="text-sm text-muted-foreground">
                {row.original.previouslyApproved && (
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                    Previously Approved
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "company",
      header: "Company/Institution",
      cell: ({ row }) => row.getValue("company") || "-",
    },
  ];
  
  // Add event column if showing events
  if (showEventColumn) {
    columns.push({
      accessorKey: "eventId",
      header: "Event",
      cell: ({ row }) => getEventName(row.getValue("eventId")),
    });
  }
  
  // Add status columns
  columns = [
    ...columns,
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <ParticipantStatusBadge status={row.getValue("status")} />
      ),
    },
    {
      accessorKey: "backgroundCheckStatus",
      header: "Background Check",
      cell: ({ row }) => (
        <BackgroundCheckStatusBadge status={row.getValue("backgroundCheckStatus")} />
      ),
    },
    {
      accessorKey: "registeredAt",
      header: "Registered",
      cell: ({ row }) => {
        const date = row.original.registeredAt;
        return date ? format(new Date(date), "MMM d, yyyy") : "-";
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const participant = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/participants/${participant.id}`}>View details</Link>
              </DropdownMenuItem>
              {participant.status === "pending" || participant.status === "in_review" ? (
                <>
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate(
                      participant.id, 
                      "in_review", 
                      "in_progress"
                    )}
                  >
                    Start review
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => loadEmailTemplate(participant.id, "approval")}
                  >
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Approve & email
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => loadEmailTemplate(participant.id, "rejection")}
                  >
                    <X className="mr-2 h-4 w-4 text-red-500" />
                    Reject & email
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  onClick={() => loadEmailTemplate(
                    participant.id, 
                    participant.status === "approved" ? "approval" : "rejection"
                  )}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send email
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      
      <DataTable
        columns={columns}
        data={participants || []}
        filterColumn="email"
        filterPlaceholder="Filter by email..."
        isLoading={isLoading}
      />
      
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {emailType === "approval" ? "Send Approval Email" : "Send Rejection Email"}
            </DialogTitle>
            <DialogDescription>
              Review and customize the email that will be sent to the participant.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="preview">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="edit">Edit</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="space-y-4 py-4">
              <div className="border rounded-md p-4 bg-muted/20">
                <div><strong>To:</strong> {selectedParticipant?.email}</div>
                <div className="mt-2">
                  <strong>Subject:</strong> {emailType === "approval" 
                    ? "Your registration has been approved" 
                    : "Regarding your event registration"}
                </div>
                <div className="mt-4 whitespace-pre-wrap">{emailContent}</div>
              </div>
            </TabsContent>
            <TabsContent value="edit">
              <Textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                className="min-h-[200px]"
              />
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setEmailDialogOpen(false)}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button 
                variant={emailType === "approval" ? "default" : "destructive"}
                onClick={handleSendEmail}
              >
                <Mail className="mr-2 h-4 w-4" />
                Send {emailType === "approval" ? "Approval" : "Rejection"} Email
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
