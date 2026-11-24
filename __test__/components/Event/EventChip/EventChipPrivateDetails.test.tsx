import { EventChip } from '@common/components/Event/EventChip/EventChip'
import { EventErrorHandler } from '@common/components/Error/EventErrorHandler'
import { EventDisplayInfo } from '@fullcalendar/react'
import { screen } from '@testing-library/react'
import React from 'react'
import { renderWithProviders } from '../../../utils/Renderwithproviders'

const preloadedState = {
  user: { userData: { email: 'alice@example.com', openpaasId: 'alice' } },
  calendars: {
    list: {
      'alice/cal': {
        id: 'alice/cal',
        name: 'Alice',
        color: { light: '#0B8043', dark: '#FFFFFF' },
        owner: { emails: ['alice@example.com'] }
      },
      'bob/cal': {
        id: 'bob/cal',
        name: 'Bob',
        color: { light: '#3F51B5', dark: '#FFFFFF' },
        owner: { emails: ['bob@example.com'] }
      }
    },
    templist: {}
  }
}

const start = new Date('2026-11-11T09:00:00Z')
const end = new Date('2026-11-11T11:00:00Z')

const twoHourEvent = (
  calId: string,
  classification: string
): EventDisplayInfo =>
  ({
    event: {
      id: `${calId}/e1`,
      title: 'Doctor',
      start,
      end,
      allDay: false,
      _def: {
        extendedProps: {
          uid: 'e1',
          calId,
          class: classification,
          location: 'Clinic, 12 rue Example',
          description: 'Bring the test results'
        }
      },
      _instance: { range: { start, end } }
    },
    view: { type: 'timeGridWeek', calendar: { getOption: () => 'UTC' } }
  }) as unknown as EventDisplayInfo

const renderChip = (arg: EventDisplayInfo): void => {
  renderWithProviders(
    <EventChip arg={arg} errorHandler={{} as EventErrorHandler} />,
    preloadedState
  )
}

describe('event chip details of a private event', () => {
  // A wide chip: jsdom measures every element 0 px wide, the compact chip
  // shows no details at all
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get: () => 200
    })
  })

  afterAll(() => {
    delete (HTMLElement.prototype as { offsetWidth?: number }).offsetWidth
  })

  it("hides the location and description of a private event of someone else's calendar (#2209)", () => {
    renderChip(twoHourEvent('bob/cal', 'PRIVATE'))

    expect(screen.queryByText('Clinic, 12 rue Example')).toBe(null)
    expect(screen.queryByText('Bring the test results')).toBe(null)
  })

  it('shows them on the own calendar of the user', () => {
    renderChip(twoHourEvent('alice/cal', 'PRIVATE'))

    expect(screen.getByText('Clinic, 12 rue Example')).toBeInTheDocument()
    expect(screen.getByText('Bring the test results')).toBeInTheDocument()
  })

  it("shows them for a public event of someone else's calendar", () => {
    renderChip(twoHourEvent('bob/cal', 'PUBLIC'))

    expect(screen.getByText('Clinic, 12 rue Example')).toBeInTheDocument()
  })
})
