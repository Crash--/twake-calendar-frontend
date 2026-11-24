import { DesktopEventChipSchedule } from '@common/components/Event/EventChip/DesktopEventChipSchedule'
import DesktopResultItem from '@common/features/Search/DesktopResultItem'
import { SearchEventResult } from '@common/features/Search/types/SearchEventResult'
import { Calendar } from '@common/types/CalendarTypes'
import { EventDisplayInfo } from '@fullcalendar/react'
import { screen } from '@testing-library/react'
import React from 'react'
import { renderWithProviders } from '../../../utils/Renderwithproviders'

const calendar = (owner: string): Partial<Calendar> => ({
  id: `${owner}/cal`,
  name: owner,
  color: { light: '#3F51B5', dark: '#FFFFFF' },
  owner: { emails: [`${owner}@example.com`] } as Calendar['owner'],
  events: {}
})

const preloadedState = {
  user: { userData: { email: 'alice@example.com', openpaasId: 'alice' } },
  calendars: {
    list: { 'alice/cal': calendar('alice'), 'bob/cal': calendar('bob') },
    templist: {}
  }
}

const LOCATION = 'Clinic, 12 rue Example'
const DESCRIPTION = 'Bring the test results'

const start = new Date('2026-11-11T09:00:00Z')
const end = new Date('2026-11-11T11:00:00Z')

const scheduleArg = (owner: string): EventDisplayInfo => {
  const extendedProps = {
    uid: 'e1',
    calId: `${owner}/cal`,
    class: 'PRIVATE',
    location: LOCATION,
    description: DESCRIPTION
  }
  const event = {
    id: 'e1',
    title: 'Doctor',
    start,
    end,
    allDay: false,
    extendedProps,
    _def: { extendedProps }
  }
  return {
    event,
    isStart: true,
    isEnd: true,
    view: {
      type: 'listWeek',
      activeStart: new Date('2026-11-09T00:00:00Z'),
      activeEnd: new Date('2026-11-16T00:00:00Z'),
      calendar: { getEvents: () => [event] }
    }
  } as unknown as EventDisplayInfo
}

const searchResult = (owner: string): SearchEventResult => ({
  data: {
    uid: 'e1',
    userId: owner,
    calendarId: 'cal',
    start: start.toISOString(),
    end: end.toISOString(),
    summary: 'Doctor',
    class: 'PRIVATE',
    location: LOCATION,
    description: DESCRIPTION
  },
  _links: { self: { href: '' } }
})

const dayData = {
  isFirstRow: true,
  isToday: false,
  dayNum: '11',
  dayName: 'WED'
}

describe("details of a private event of someone else's calendar (#2209)", () => {
  it('the schedule view hides them', () => {
    renderWithProviders(
      <DesktopEventChipSchedule
        arg={scheduleArg('bob')}
        calendars={{}}
        tempcalendars={{}}
        timezone="UTC"
        dayData={dayData}
      />,
      preloadedState
    )

    expect(screen.queryByText(LOCATION)).toBe(null)
    expect(screen.queryByText(DESCRIPTION)).toBe(null)
  })

  it('the schedule view shows them on the own calendar of the user', () => {
    renderWithProviders(
      <DesktopEventChipSchedule
        arg={scheduleArg('alice')}
        calendars={{}}
        tempcalendars={{}}
        timezone="UTC"
        dayData={dayData}
      />,
      preloadedState
    )

    expect(screen.getByText(LOCATION)).toBeInTheDocument()
  })

  it('a search result hides them', () => {
    renderWithProviders(
      <DesktopResultItem
        eventData={searchResult('bob')}
        hasDetails
        hasVideo={false}
      />,
      preloadedState
    )

    expect(screen.queryByText(LOCATION)).toBe(null)
    expect(screen.queryByText(DESCRIPTION)).toBe(null)
  })

  it('a search result shows them on the own calendar of the user', () => {
    renderWithProviders(
      <DesktopResultItem
        eventData={searchResult('alice')}
        hasDetails
        hasVideo={false}
      />,
      preloadedState
    )

    expect(screen.getByText(LOCATION)).toBeInTheDocument()
  })
})
