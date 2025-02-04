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
        'bg-slate-200 hover:bg-slate-300 active:bg-slate-700',
        'dark:bg-slate-600 dark:hover:bg-slate-800 dark:active:bg-slate-900 dark:text-white',
        'cursor-pointer rounded disabled:cursor-not-allowed disabled:text-gray-400',
        rounded && 'rounded-full',
        'disabled:bg-slate-800',
        'px-4 py-2 flex items-center min-w-12',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
