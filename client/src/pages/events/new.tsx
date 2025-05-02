import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EventForm } from "@/components/events/event-form";

export default function NewEventPage() {
  return (
    <DashboardLayout title="Create New Event">
      <EventForm />
    </DashboardLayout>
  );
}
