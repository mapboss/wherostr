import { Sensors } from '@mui/icons-material'
import { Typography } from '@mui/material'
import classNames from 'classnames'
import { useMemo } from 'react'

const StatusBadge = ({
  className,
  status,
}: {
  className?: string
  status?: 'live' | 'ended'
}) => {
  const _className = useMemo(() => {
    switch (status) {
      case 'live':
        return 'bg-error'
      default:
        return 'bg-disabled'
    }
  }, [status])
  const icon = useMemo(() => {
    switch (status) {
      case 'live':
        return <Sensors className="mr-1" />
    }
  }, [status])
  const label = useMemo(() => {
    switch (status) {
      case 'live':
        return 'Live'
      case 'ended':
        return 'Ended'
    }
  }, [status])
  return (
    <Typography
      className={classNames(className, _className, 'rounded px-2 shadow')}
      variant="subtitle2"
    >
      {icon}
      {label}
    </Typography>
  )
}

export default StatusBadge
