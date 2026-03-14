import { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: string
  rightElement?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightElement, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-body font-semibold text-dark">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">{icon}</span>
          )}
          <input
            ref={ref}
            className={`
              w-full rounded-2xl border-2 border-surface bg-white px-4 py-3 font-body text-dark
              placeholder:text-muted focus:border-primary focus:outline-none transition-colors
              ${icon ? 'pl-11' : ''}
              ${rightElement ? 'pr-11' : ''}
              ${error ? 'border-red-400' : ''}
              ${className}
            `}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500 font-body">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-body font-semibold text-dark">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full rounded-2xl border-2 border-surface bg-white px-4 py-3 font-body text-dark
            placeholder:text-muted focus:border-primary focus:outline-none transition-colors resize-none
            ${error ? 'border-red-400' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-red-500 font-body">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
