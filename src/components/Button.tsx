import classNames from 'classnames'
import React from 'react'

export default function Button({
  className,
  children,
  rounded,
  ...rest
}: {
  className?: string
  rounded?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={classNames(
        'transition-all duration-100',
        'bg-blue-200 hover:bg-blue-300 active:bg-blue-700',
        'dark:bg-blue-600 dark:hover:bg-blue-800 dark:active:bg-blue-900 dark:text-white',
        'cursor-pointer rounded disabled:cursor-not-allowed disabled:text-gray-400',
        rounded && 'rounded-full',
        'disabled:bg-blue-800',
        'px-4 py-2 flex items-center min-w-12',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
