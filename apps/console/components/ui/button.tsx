import * as React from "react";
import { Button as ArcoButton } from "@arco-design/web-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

function mapVariant(variant: ButtonVariant) {
  switch (variant) {
    case "secondary":
      return { type: "secondary" as const };
    case "outline":
      return { type: "outline" as const };
    case "ghost":
    case "link":
      return { type: "text" as const };
    case "destructive":
      return { type: "primary" as const, status: "danger" as const };
    case "default":
    default:
      return { type: "primary" as const };
  }
}

function mapSize(size: ButtonSize) {
  switch (size) {
    case "sm":
      return "small" as const;
    case "lg":
      return "large" as const;
    case "icon":
      return "small" as const;
    case "default":
    default:
      return "default" as const;
  }
}

export interface ButtonProps
  extends Omit<React.ComponentPropsWithoutRef<typeof ArcoButton>, "type" | "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
    const mappedVariant = mapVariant(variant);
    const mappedSize = mapSize(size);

    if (asChild && React.isValidElement(children)) {
      const childProps = children.props as {
        href?: string;
        target?: string;
        rel?: string;
        children?: React.ReactNode;
      };

      return (
        <ArcoButton
          ref={ref}
          className={className}
          size={mappedSize}
          {...mappedVariant}
          href={childProps.href}
          target={childProps.target}
          rel={childProps.rel}
          {...props}
        >
          {childProps.children ?? children}
        </ArcoButton>
      );
    }

    return (
      <ArcoButton
        ref={ref}
        className={className}
        size={mappedSize}
        {...mappedVariant}
        {...props}
      >
        {children}
      </ArcoButton>
    );
  }
);
Button.displayName = "Button";

export function buttonVariants({
  variant,
  size,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(className, variant, size);
}

export { Button };
