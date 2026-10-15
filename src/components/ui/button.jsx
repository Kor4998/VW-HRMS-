import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority";
import { cn } from "cn"

// Untitled UI buttons: sizes xs 32 / sm 36 / md 40 / lg 44, radius-md, Text sm semibold, shadow-xs.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent text-sm font-semibold whitespace-nowrap shadow-xs transition-colors outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[inset_0_0_0_1px_rgb(10_13_18/0.18),inset_0_-2px_0_rgb(10_13_18/0.05),0_1px_2px_rgb(10_13_18/0.05)] hover:brightness-95 dark:hover:brightness-110",
        outline:
          "border-input bg-background text-secondary-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "border-primary/25 bg-primary/10 text-[#1F5FE6] hover:bg-primary/15 dark:text-[#A5C4FB]",
        ghost:
          "border-transparent bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground aria-expanded:bg-muted dark:hover:bg-accent",
        destructive:
          "bg-destructive text-white shadow-[inset_0_0_0_1px_rgb(10_13_18/0.18),inset_0_-2px_0_rgb(10_13_18/0.05),0_1px_2px_rgb(10_13_18/0.05)] hover:brightness-95 focus-visible:ring-destructive/30",
        link: "h-auto border-transparent p-0 text-primary shadow-none underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        xs: "h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-4",
        sm: "h-9 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        lg: "h-11 px-[18px] text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-10",
        "icon-xs": "size-8",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
