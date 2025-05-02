import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ParticipantReview } from "@/components/participants/participant-review";

export default function ParticipantReviewPage() {
  return (
    <DashboardLayout title="Review Participants">
      <ParticipantReview />
    </DashboardLayout>
  );
}
