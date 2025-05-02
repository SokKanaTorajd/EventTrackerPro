import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

type StatusConfig = {
  [key: string]: {
    label: string;
    className: string;
  };
};

const participantStatuses: StatusConfig = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-800",
  },
  in_review: {
    label: "In Review",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800",
  },
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800",
  },
};

const eventStatuses: StatusConfig = {
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800",
  },
  active: {
    label: "Active",
    className: "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800",
  },
  completed: {
    label: "Completed",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800",
  },
};

const backgroundCheckStatuses: StatusConfig = {
  not_started: {
    label: "Not Started",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800",
  },
  not_required: {
    label: "Not Required",
    className: "bg-purple-100 text-purple-800 hover:bg-purple-100 hover:text-purple-800",
  },
};

export function ParticipantStatusBadge({ status, className }: StatusBadgeProps) {
  const config = participantStatuses[status] || {
    label: status,
    className: "bg-gray-100 text-gray-800",
  };
  
  return (
    <Badge
      variant="outline"
      className={cn("font-medium capitalize", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

export function EventStatusBadge({ status, className }: StatusBadgeProps) {
  const config = eventStatuses[status] || {
    label: status,
    className: "bg-gray-100 text-gray-800",
  };
  
  return (
    <Badge
      variant="outline"
      className={cn("font-medium capitalize", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

export function BackgroundCheckStatusBadge({ status, className }: StatusBadgeProps) {
  const config = backgroundCheckStatuses[status] || {
    label: status,
    className: "bg-gray-100 text-gray-800",
  };
  
  return (
    <Badge
      variant="outline"
      className={cn("font-medium capitalize", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
