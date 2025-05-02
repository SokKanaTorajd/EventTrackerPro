import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatsCardProps {
  icon: ReactNode;
  iconColor: string;
  title: string;
  value: string | number;
  linkText?: string;
  linkHref?: string;
  className?: string;
}

export function StatsCard({
  icon,
  iconColor,
  title,
  value,
  linkText,
  linkHref,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", iconColor)}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">
                  {value}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
      {linkText && linkHref && (
        <CardFooter className="bg-muted/50 px-6 py-4">
          <div className="text-sm">
            <a
              href={linkHref}
              className="font-medium text-primary hover:text-primary/80"
            >
              {linkText}
              <span aria-hidden="true"> &rarr;</span>
            </a>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
