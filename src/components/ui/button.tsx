import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

// Checklist #28 — the shared Button component was underused largely because its
// styling never actually matched the app's real, established visual language
// (.btn-primary/.btn-secondary gradients, rounded-xl, font-bold, hover lift) —
// it shipped with generic rounded-md/h-10/font-medium defaults that would have
// looked visibly out of place next to every real button in the app. Fixed here
// so migrating onto it is actually safe. buttonVariants() is also exported so
// non-<button> elements (e.g. Next.js <Link> used for navigational CTAs like the
// dashboard quick actions) can apply the exact same classes without needing to
// be forced into a <button onClick={() => router.push(...)}> just to "use the
// shared component" -- that would trade real navigation semantics for nothing.

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'default' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function buttonVariants({
  variant = 'primary',
  size = 'default',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none whitespace-nowrap',
    {
      'btn-primary':                                                                   variant === 'primary',
      'btn-secondary':                                                                  variant === 'secondary',
      'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm': variant === 'outline',
      'text-gray-500 hover:text-gray-700 hover:bg-gray-50':                             variant === 'ghost',
      'bg-red-600 text-white hover:bg-red-700 hover:shadow-md':                         variant === 'destructive',
    },
    {
      'px-3 py-1.5 text-xs':  size === 'sm',
      'px-6 py-3 text-sm':    size === 'default',
      'px-8 py-4 text-base':  size === 'lg',
    },
    className
  )
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
