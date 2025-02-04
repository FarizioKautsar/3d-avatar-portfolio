import { createSafeActionClient } from 'next-safe-action'
import { yupAdapter } from 'next-safe-action/adapters/yup'

export const actionClient = createSafeActionClient({
  validationAdapter: yupAdapter(),
})
