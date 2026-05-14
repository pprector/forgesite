import * as React from "react";
import { Skeleton as ArcoSkeleton } from "@arco-design/web-react";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <ArcoSkeleton className={cn(className)} {...props} />;
}

export { Skeleton };
