import React from 'react'
import clsx from 'clsx'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  elevated = true,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-gray-200',
        elevated && 'shadow-sm',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
