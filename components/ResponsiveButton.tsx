import { Button, ButtonProps, Hidden, Tooltip } from '@mui/material'
import classNames from 'classnames'
import { FC } from 'react'

const ResponsiveButton: FC<ButtonProps> = (props) => {
  const { startIcon, children, className, ...other } = props
  return (
    <>
      <Hidden lgDown>
        <Button
          {...other}
          startIcon={startIcon}
          className={classNames(className, 'min-w-[auto]')}
        >
          {children}
        </Button>
      </Hidden>
      <Hidden lgUp>
        <Tooltip title={children}>
          <Button {...other} className={classNames(className, 'min-w-[auto]')}>
            {startIcon}
          </Button>
        </Tooltip>
      </Hidden>
    </>
  )
}

export default ResponsiveButton
