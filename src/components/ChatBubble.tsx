import { ChatBubbleType } from '@/types'
import classNames from 'classnames'
import Button from './Button'
import Spinner from './Spinner'

export default function ChatBubble({
  children,
  onRetry,
  ...chat
}: ChatBubbleType & React.ButtonHTMLAttributes<HTMLDivElement> & { onRetry?: Function }) {
  return (
    <div
      className={classNames(
        'rounded-2xl py-3 px-4 mb-4 w-fit max-w-[600px]',
        chat.role === 'assistant'
          ? 'text-left bg-gradient-to-tr text-white from-blue-400 to-blue-500 dark:from-blue-900 dark:to-blue-700 rounded-es-none'
          : 'text-right bg-gradient-to-tl border border-blue-500 bg-white text-black dark:bg-black dark:text-white rounded-ee-none',
      )}
    >
      {chat.isError ? (
        <>
          There seems to be a problem. Let&apos;s retry that!
          {onRetry && (
            <Button className='mt-3' onClick={() => onRetry()}>
              Retry
            </Button>
          )}
        </>
      ) : chat.loading ? (
        <Spinner />
      ) : (
        children
      )}
    </div>
  )
}
