import * as React from "react";
import { Input as ArcoInput } from "@arco-design/web-react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends Omit<React.ComponentPropsWithoutRef<typeof ArcoInput>, "onChange"> {
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, onChange, ...props }, ref) => {
    return (
      <ArcoInput
        ref={ref as never}
        className={cn(className)}
        onChange={(_, event) => {
          onChange?.(event as React.ChangeEvent<HTMLInputElement>);
        }}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
