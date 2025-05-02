import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ParticipantList } from "@/components/participants/participant-list";

export default function ParticipantsPage() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split("?")[1]);
  const eventId = urlParams.get("eventId") ? parseInt(urlParams.get("eventId")!) : undefined;
  
  return (
    <DashboardLayout title="Participants">
      <ParticipantList eventId={eventId} />
    </DashboardLayout>
  );
}
