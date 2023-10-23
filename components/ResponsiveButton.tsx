import { LoadingButton, LoadingButtonProps } from '@mui/lab'
import { Hidden, Tooltip } from '@mui/material'
import classNames from 'classnames'
import { FC } from 'react'

const ResponsiveButton: FC<LoadingButtonProps> = (props) => {
  const { startIcon, children, className, ...other } = props
  return (
    <>
      <Hidden mdDown>
        <LoadingButton
          {...other}
          startIcon={startIcon}
          className={classNames(className, 'min-w-[auto]')}
        >
          {children}
        </LoadingButton>
      </Hidden>
      <Hidden mdUp>
        <Tooltip title={children}>
          <LoadingButton
            {...other}
            size="small"
            className={classNames(className, 'min-w-[auto]')}
          >
            {startIcon}
          </LoadingButton>
        </Tooltip>
      </Hidden>
    </>
  )
}

export default ResponsiveButton
