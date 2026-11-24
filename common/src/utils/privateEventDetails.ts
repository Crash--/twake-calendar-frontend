import { Calendar } from '@common/types/CalendarTypes'

export const isMaskedClassification = (classification?: string): boolean =>
  classification === 'PRIVATE' || classification === 'CONFIDENTIAL'

export const isOwnCalendar = (
  calendar: Calendar | undefined,
  userEmail: string | undefined
): boolean => calendar?.owner?.emails?.includes(userEmail ?? '') ?? false

// The location, description and other details of a private event show only
// on the user's own calendar
export const showsEventDetails = (
  classification: string | undefined,
  calendar: Calendar | undefined,
  userEmail: string | undefined
): boolean =>
  !isMaskedClassification(classification) || isOwnCalendar(calendar, userEmail)
