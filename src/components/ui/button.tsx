import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] hover:shadow-lg",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-primary-variant text-primary-foreground hover:shadow-glow hover:from-primary/90 hover:to-primary-variant/90 border-0",
        destructive:
          "bg-gradient-to-r from-destructive to-red-600 text-destructive-foreground hover:from-destructive/90 hover:to-red-600/90 shadow-lg",
        outline:
          "border-2 border-border bg-background/50 backdrop-blur-sm hover:bg-card-hover hover:border-primary/30 hover:shadow-md",
        secondary:
          "bg-gradient-to-r from-secondary to-secondary-hover text-secondary-foreground hover:shadow-md",
        ghost: "hover:bg-accent/80 hover:text-accent-foreground hover:shadow-sm",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-variant",
        premium: "bg-gradient-to-r from-brand to-purple-600 text-brand-foreground hover:shadow-glow hover:from-brand/90 hover:to-purple-600/90",
        success: "bg-gradient-to-r from-success to-green-600 text-success-foreground hover:shadow-lg hover:from-success/90 hover:to-green-600/90",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-13 rounded-xl px-10 text-base",
        icon: "h-11 w-11",
        xl: "h-16 rounded-2xl px-12 text-lg font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
