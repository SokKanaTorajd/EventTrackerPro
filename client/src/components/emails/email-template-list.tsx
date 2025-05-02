import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplate } from "@shared/schema";
import { format } from "date-fns";
import { Plus, ArrowUpDown, MoreHorizontal, Copy, Star, Trash } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export function EmailTemplateList() {
  const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: templates, isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/email-templates"],
  });

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    
    try {
      await apiRequest("DELETE", `/api/email-templates/${templateToDelete}`);
      
      toast({
        title: "Template deleted",
        description: "The email template has been deleted successfully.",
      });
      
      // Refetch templates
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTemplateToDelete(null);
    }
  };

  const handleSetAsDefault = async (id: number, type: string) => {
    try {
      // Find the current template
      const template = templates?.find(t => t.id === id);
      if (!template) return;
      
      // Update the template to be the default
      await apiRequest("PUT", `/api/email-templates/${id}`, { 
        ...template,
        isDefault: true
      });
      
      // Fetch all templates of the same type
      const sameTypeTemplates = templates?.filter(t => t.type === type && t.id !== id) || [];
      
      // Update other templates of the same type to not be default
      for (const otherTemplate of sameTypeTemplates) {
        if (otherTemplate.isDefault) {
          await apiRequest("PUT", `/api/email-templates/${otherTemplate.id}`, {
            ...otherTemplate,
            isDefault: false
          });
        }
      }
      
      toast({
        title: "Default template updated",
        description: `The template is now the default for ${type} emails.`,
      });
      
      // Refetch templates
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update default template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const duplicateTemplate = async (id: number) => {
    try {
      // Find the template to duplicate
      const template = templates?.find(t => t.id === id);
      if (!template) return;
      
      // Create a new template based on the original
      const newTemplate = {
        name: `${template.name} (Copy)`,
        subject: template.subject,
        body: template.body,
        type: template.type,
        isDefault: false,
        createdById: template.createdById
      };
      
      await apiRequest("POST", "/api/email-templates", newTemplate);
      
      toast({
        title: "Template duplicated",
        description: "A copy of the template has been created.",
      });
      
      // Refetch templates
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTemplateType = (type: string) => {
    switch (type) {
      case "approval":
        return { label: "Approval", color: "bg-green-100 text-green-800" };
      case "rejection":
        return { label: "Rejection", color: "bg-red-100 text-red-800" };
      case "reminder":
        return { label: "Reminder", color: "bg-blue-100 text-blue-800" };
      case "custom":
        return { label: "Custom", color: "bg-gray-100 text-gray-800" };
      default:
        return { label: type, color: "bg-gray-100 text-gray-800" };
    }
  };

  const columns: ColumnDef<EmailTemplate>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Template Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const isDefault = row.original.isDefault;
        return (
          <div className="flex items-center">
            {isDefault && <Star className="mr-2 h-4 w-4 text-yellow-500" />}
            <span className="font-medium">{row.getValue("name")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        const { label, color } = formatTemplateType(type);
        
        return (
          <Badge variant="outline" className={color}>
            {label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }) => {
        const subject = row.getValue("subject") as string;
        return (
          <div className="truncate max-w-[300px]">
            {subject}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = row.original.createdAt;
        return date ? format(new Date(date), "MMM d, yyyy") : "-";
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const template = row.original;
        
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
                <Link to={`/email-templates/${template.id}`}>Edit template</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicateTemplate(template.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              {!template.isDefault && (
                <DropdownMenuItem onClick={() => handleSetAsDefault(template.id, template.type)}>
                  <Star className="mr-2 h-4 w-4 text-yellow-500" />
                  Set as default
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setTemplateToDelete(template.id)}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Email Templates</h2>
        <Button asChild>
          <Link to="/email-templates/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Link>
        </Button>
      </div>
      
      <DataTable
        columns={columns}
        data={templates || []}
        filterColumn="name"
        filterPlaceholder="Filter templates..."
        isLoading={isLoading}
      />
      
      <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the email template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
