import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EmailTemplateList } from "@/components/emails/email-template-list";

export default function EmailTemplatesPage() {
  return (
    <DashboardLayout title="Email Templates">
      <EmailTemplateList />
    </DashboardLayout>
  );
}
