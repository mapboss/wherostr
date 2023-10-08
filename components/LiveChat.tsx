import { Send } from '@mui/icons-material'
import {
  Box,
  BoxProps,
  Button,
  Divider,
  TextField,
  Typography,
} from '@mui/material'
import { useContext, useEffect, useRef } from 'react'
import { LiveActivityItem } from './LiveActivity'
import { AccountContext } from '@/contexts/AccountContext'

export function LiveChat({
  naddr,
  event,
  ...props
}: Omit<BoxProps, 'children'> & {
  naddr?: string
  event?: LiveActivityItem
}) {
  const { user } = useContext(AccountContext)
  const ref = useRef<Window>(
    typeof window !== 'undefined' ? window.frames : null,
  )

  //   useEffect(() => {
  //     if (!ref.current) return
  //     console.log('session', ref.current.localStorage.getItem('session'))
  //   }, [])

  return (
    <Box {...props} display="flex" flexDirection="column">
      <iframe
        // ref={ref}
        style={{ backgroundColor: 'transparent' }}
        src={`https://nostrudel.ninja/#/streams/${naddr}?displayMode=log&colorMode=dark`}
        width="100%"
        height="100%"
        allowTransparency={true}
      />
      <Divider />
      <Box
        className="flex items-center"
        m={1}
        component="form"
        onSubmit={(evt) => {
          evt.preventDefault()
        }}
      >
        {user ? (
          <>
            <TextField
              color="secondary"
              name="message"
              type="text"
              autoComplete="off"
              placeholder="Message"
              fullWidth
              size="small"
              multiline
              maxRows={3}
            />
            <Box mx={0.5} />
            <Button
              variant="outlined"
              color="secondary"
              size="large"
              startIcon={<Send />}
            >
              Send
            </Button>
          </>
        ) : (
          <TextField
            placeholder="Please login to write messages!"
            fullWidth
            disabled
            size="small"
          />
        )}
      </Box>
    </Box>
  )
}
