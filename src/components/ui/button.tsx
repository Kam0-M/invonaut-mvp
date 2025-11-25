import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-primary text-white hover:bg-primary/90': variant === 'default',
            'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50': variant === 'outline',
            'bg-secondary text-white hover:bg-secondary/90': variant === 'secondary',
            'hover:bg-gray-100 text-gray-900': variant === 'ghost',
            'bg-destructive text-white hover:bg-destructive/90': variant === 'destructive',
          },
          {
            'h-10 py-2 px-4': size === 'default',
            'h-9 px-3 text-sm': size === 'sm',
            'h-11 px-8 text-base': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }