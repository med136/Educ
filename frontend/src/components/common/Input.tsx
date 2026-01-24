import React from 'react'
import clsx from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full px-4 py-2.5 rounded-lg border text-sm bg-white placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all',
          error
            ? 'border-danger-500 focus:ring-danger-500'
            : 'border-gray-300 focus:border-primary-500',
          className,
        )}
        {...props}
      />
      {(helperText || error) && (
        <p className={clsx('text-xs', error ? 'text-danger-600' : 'text-gray-500')}>
          {error || helperText}
        </p>
      )}
    </div>
  )
}

export default Input
