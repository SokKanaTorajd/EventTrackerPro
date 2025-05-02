import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  title: string;
  description: string;
  actionText: string;
  actionHref?: string;
  onClick?: () => void;
  variant?: ButtonProps["variant"];
  className?: string;
}

export function ActionCard({
  title,
  description,
  actionText,
  actionHref,
  onClick,
  variant = "default",
  className,
}: ActionCardProps) {
  return (
    <Card className={cn("overflow-hidden divide-y divide-border", className)}>
      <CardContent className="px-6 py-5">
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter className="px-6 py-4">
        {actionHref ? (
          <Button variant={variant} asChild>
            <a href={actionHref}>{actionText}</a>
          </Button>
        ) : (
          <Button variant={variant} onClick={onClick}>
            {actionText}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
