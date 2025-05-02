import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EventList } from "@/components/events/event-list";

export default function EventsPage() {
  return (
    <DashboardLayout title="Events">
      <EventList />
    </DashboardLayout>
  );
}
