import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EmailTemplateForm } from "@/components/emails/email-template-form";

export default function NewEmailTemplatePage() {
  return (
    <DashboardLayout title="Create Email Template">
      <EmailTemplateForm />
    </DashboardLayout>
  );
}
