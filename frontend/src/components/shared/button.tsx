// src/components/shared/button.tsx
import * as React from "react"
import { cn } from "@/lib/helpers/index"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'destructive';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        const variants = {
            default: 'bg-blue-600 text-white hover:bg-blue-700',
            outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
            destructive: 'bg-red-600 text-white hover:bg-red-700',
        };

        return (
            <button
                className={cn(
                    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50',
                    variants[variant],
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }