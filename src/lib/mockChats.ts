import { ChatBubbleType } from '@/types'

const mockChatData: ChatBubbleType[] = [
  { role: 'user', content: 'Hey, can you help me with my code?' },
  { role: 'assistant', content: 'Of course! What seems to be the issue?' },
  { role: 'user', content: 'I’m getting an error in my API response, but I’m not sure why.' },
  { role: 'assistant', content: 'Can you share the error message and the relevant code snippet?' },
  { role: 'user', content: 'Here’s the error: 500 Internal Server Error. And this is my handler function...' },
  // { role: 'assistant', loading: true },
  {
    role: 'assistant',
    content: 'It looks like there might be an issue with your database query. Are you handling exceptions properly?',
  },
  { role: 'user', content: 'I think so. I have a try-catch block, but the error persists.' },
  { role: 'assistant', content: 'Can you log the error inside your catch block and share the output?' },
  { role: 'user', content: 'Here’s the log output: "Database connection failed".' },
  {
    role: 'assistant',
    content:
      'It seems like there might be an issue with your database configuration. Check if your database credentials are correct and that the database server is running.',
  },
  { role: 'user', content: 'Got it! Let me check that now.' },
  { role: 'assistant', content: 'Sure! Let me know if you need further assistance.' },
  { role: 'user', content: 'Thanks a lot!' },
]

export default mockChatData
