import { useQuery } from "@tanstack/react-query";
import { ParticipantStatusBadge } from "@/components/ui/status-badge";
import { AvatarWithFallback, getInitials } from "@/components/ui/avatar-with-fallback";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Participant } from "@shared/schema";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function RecentParticipants() {
  const [eventFilter, setEventFilter] = useState<string>("all");
  
  const { data: participants, isLoading: participantsLoading } = useQuery<Participant[]>({
    queryKey: ["/api/stats/recent-participants"],
  });
  
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events"],
  });
  
  const filteredParticipants = useMemo(() => {
    if (!participants) return [];
    if (eventFilter === "all") return participants;
    
    return participants.filter(
      participant => participant.eventId === parseInt(eventFilter)
    );
  }, [participants, eventFilter]);

  const isLoading = participantsLoading || eventsLoading;

  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        
        <div className="mt-4 flex flex-col">
          <div className="overflow-x-auto">
            <div className="py-2 align-middle inline-block min-w-full">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <div className="min-w-full divide-y divide-gray-200">
                  <div className="bg-gray-50">
                    <div className="grid grid-cols-5 gap-4 py-3.5 px-6">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-4 w-24" />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white divide-y divide-gray-200">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="grid grid-cols-5 gap-4 py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-24 mb-1" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-32 self-center" />
                        <Skeleton className="h-4 w-32 self-center" />
                        <Skeleton className="h-6 w-16 self-center rounded-full" />
                        <Skeleton className="h-4 w-8 self-center ml-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center">
        <h2 className="text-lg leading-6 font-medium text-gray-900">
          Recent Participants
        </h2>
        <Select
          value={eventFilter}
          onValueChange={setEventFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {events?.map((event) => (
              <SelectItem key={event.id} value={event.id.toString()}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-2 flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Company
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredParticipants.length > 0 ? (
                    filteredParticipants.map((participant) => {
                      const eventName = events?.find(e => e.id === participant.eventId)?.name || 'Unknown Event';
                      return (
                        <tr key={participant.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <AvatarWithFallback
                                  alt={`${participant.firstName} ${participant.lastName}`}
                                  fallback={getInitials(`${participant.firstName} ${participant.lastName}`)}
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {participant.firstName} {participant.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {eventName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{participant.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{participant.company || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <ParticipantStatusBadge status={participant.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              to={`/participants/${participant.id}`}
                              className="text-primary hover:text-primary/80"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                        No participants found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
