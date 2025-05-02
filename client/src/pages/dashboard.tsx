import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { RecentParticipants } from "@/components/dashboard/recent-participants";
import { QuickActions } from "@/components/dashboard/quick-actions";

export default function Dashboard() {
  return (
    <DashboardLayout title="Dashboard">
      {/* Stats cards */}
      <DashboardStats />
      
      {/* Upcoming Events */}
      <UpcomingEvents />
      
      {/* Recent Participants */}
      <RecentParticipants />
      
      {/* Quick Actions */}
      <QuickActions />
    </DashboardLayout>
  );
}
