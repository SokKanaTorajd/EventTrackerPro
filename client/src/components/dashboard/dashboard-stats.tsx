import { StatsCard } from "@/components/ui/stats-card";
import { Calendar, Users, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardStats() {
  const { data: eventStats, isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/stats/events"],
  });

  const { data: participantStats, isLoading: participantsLoading } = useQuery({
    queryKey: ["/api/stats/participants"],
  });

  const { data: pendingReviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["/api/stats/pending-reviews"],
  });

  if (eventsLoading || participantsLoading || reviewsLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="ml-5 w-full">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </div>
            <div className="bg-muted/50 px-4 py-4">
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <StatsCard
        icon={<Calendar className="h-6 w-6 text-white" />}
        iconColor="bg-primary"
        title="Total Events"
        value={eventStats?.total || 0}
        linkText="View all events"
        linkHref="/events"
      />
      
      <StatsCard
        icon={<Users className="h-6 w-6 text-white" />}
        iconColor="bg-green-500"
        title="Active Participants"
        value={participantStats?.approved || 0}
        linkText="View all participants"
        linkHref="/participants"
      />
      
      <StatsCard
        icon={<Clock className="h-6 w-6 text-white" />}
        iconColor="bg-yellow-500"
        title="Pending Reviews"
        value={pendingReviews?.length || 0}
        linkText="Review participants"
        linkHref="/participants/review"
      />
    </div>
  );
}
