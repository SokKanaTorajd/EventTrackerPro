import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EmailTemplateForm } from "@/components/emails/email-template-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { EmailTemplate } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function EditEmailTemplatePage() {
  const [, params] = useRoute<{ id: string }>("/email-templates/:id");
  const templateId = parseInt(params?.id || "0");
  
  const { data: template, isLoading } = useQuery<EmailTemplate>({
    queryKey: [`/api/email-templates/${templateId}`],
    enabled: !!templateId,
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Edit Email Template">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!template) {
    return (
      <DashboardLayout title="Template Not Found">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">The email template you're looking for doesn't exist.</p>
              <Button asChild>
                <Link to="/email-templates">Back to Email Templates</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Edit: ${template.name}`}>
      <EmailTemplateForm 
        defaultValues={template} 
        isEditing={true} 
        templateId={templateId} 
      />
    </DashboardLayout>
  );
}
