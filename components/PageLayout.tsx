'use client'
import { Box, Paper } from '@mui/material'
import { FC, PropsWithChildren } from 'react'
import classNames from 'classnames'

export const CommonEventLayout: FC<
  PropsWithChildren & { className?: string }
> = ({ children, className }) => {
  return (
    <Box className={classNames('mx-0 md:mx-4', className)}>
      <Paper className="relative flex-auto w-full !rounded-2xl max-w-2xl mx-auto overflow-hidden">
        {children}
      </Paper>
    </Box>
  )
}

export const LiveEventLayout: FC<
  PropsWithChildren & { className?: string }
> = ({ children, className }) => {
  return (
    <Box
      className={classNames(
        'flex flex-1 mx-0 md:mx-4 overflow-hidden',
        className,
      )}
    >
      {children}
    </Box>
  )
}
