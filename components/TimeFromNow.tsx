'use client'
import TimeAgo from 'react-timeago'

const TimeFromNow = ({ date }: { date: Date }) => {
  return (
    <TimeAgo
      date={date}
      minPeriod={60}
      formatter={(value, unit) => {
        switch (unit) {
          case 'second':
            return 'now'
          case 'minute':
            return `${value} m`
          case 'hour':
            return `${value} h`
          default:
            return date.toLocaleDateString('en-us', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
        }
      }}
    />
  )
}

export default TimeFromNow
