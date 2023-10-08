import { Button, ButtonProps, Hidden, Tooltip } from '@mui/material'
import { FC } from 'react'

const ResponsiveButton: FC<ButtonProps> = (props) => {
  const { startIcon, children, ...other } = props
  return (
    <>
      <Hidden mdDown>
        <Button startIcon={startIcon} {...other}>
          {children}
        </Button>
      </Hidden>
      <Hidden mdUp>
        <Tooltip title={children}>
          <Button {...other}>{startIcon}</Button>
        </Tooltip>
      </Hidden>
    </>
  )
}

export default ResponsiveButton
