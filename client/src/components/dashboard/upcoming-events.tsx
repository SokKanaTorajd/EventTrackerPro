import { useQuery } from "@tanstack/react-query";
import { EventStatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Link } from "wouter";
import { Event } from "@shared/schema";

export function UpcomingEvents() {
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/stats/upcoming-events"],
  });

  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-7 w-40" />
        </div>
        <div className="mt-2 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <div className="min-w-full divide-y divide-gray-300">
            <div className="bg-gray-50">
              <div className="grid grid-cols-5 gap-4 py-3.5 px-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
            <div className="divide-y divide-gray-200 bg-white">
              {[1, 2, 3].map((i) => (
                <div key={i} className="grid grid-cols-5 gap-4 py-4 px-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-4 w-8 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-lg leading-6 font-medium text-gray-900">
          Upcoming Events
        </h2>
        <div className="mt-4 bg-white overflow-hidden shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">No upcoming events</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg leading-6 font-medium text-gray-900">
        Upcoming Events
      </h2>

      <div className="mt-2 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
              >
                Event Name
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Participants
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Status
              </th>
              <th
                scope="col"
                className="relative py-3.5 pl-3 pr-4 sm:pr-6"
              >
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                  {event.name}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {format(new Date(event.startDate), "MMMM d, yyyy")}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {/* This would be a real count in a full implementation */}
                    0 / {event.maxParticipants || "∞"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <EventStatusBadge status={event.status} />
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <Link
                    to={`/events/${event.id}`}
                    className="text-primary hover:text-primary/80"
                  >
                    View<span className="sr-only">, {event.name}</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
