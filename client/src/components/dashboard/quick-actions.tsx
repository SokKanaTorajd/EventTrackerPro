import { ActionCard } from "@/components/ui/action-card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export function QuickActions() {
  const { data: pendingReviews, isLoading } = useQuery({
    queryKey: ["/api/stats/pending-reviews"],
  });

  if (isLoading) {
    return (
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
            <div className="px-4 py-5 sm:px-6">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="px-4 py-4 sm:px-6">
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <ActionCard
        title="Create New Event"
        description="Set up a new event with customizable registration form."
        actionText="Create Event"
        actionHref="/events/new"
      />

      <ActionCard
        title="Review Pending"
        description={`${pendingReviews?.length || 0} participants waiting for background check completion.`}
        actionText="Review Participants"
        actionHref="/participants/review"
        variant="warning"
      />

      <ActionCard
        title="Send Notifications"
        description="Send bulk emails to participants with customizable templates."
        actionText="Send Notifications"
        actionHref="/email-templates"
        variant="success"
      />
    </div>
  );
}
