'use client'
import { TaggedNostrEvent } from '@snort/system'
import { Box, IconButton, Typography } from '@mui/material'
import {
  CommentOutlined,
  ElectricBoltOutlined,
  EmojiEmotionsOutlined,
  FormatQuoteOutlined,
  RepeatOutlined,
} from '@mui/icons-material'
import { useCallback, useContext } from 'react'
import { EventActionType, EventContext } from '@/contexts/EventContext'

const NoteActionBar = ({ event }: { event: TaggedNostrEvent }) => {
  const { setEventAction } = useContext(EventContext)
  const handleClickAction = useCallback(
    (type: EventActionType) => () => {
      setEventAction({
        type,
        event,
      })
    },
    [event, setEventAction],
  )
  return (
    <Box className="text-contrast-secondary grid grid-flow-col grid-rows-1 grid-cols-5 gap-2">
      <Box className="flex flex-row gap-2 items-center">
        <IconButton
          className="flex !text-contrast-secondary"
          size="small"
          onClick={handleClickAction(EventActionType.React)}
        >
          <EmojiEmotionsOutlined />
        </IconButton>
        <Typography variant="caption">12k</Typography>
      </Box>
      <Box className="flex flex-row gap-2 items-center">
        <IconButton
          className="flex !text-contrast-secondary"
          size="small"
          onClick={handleClickAction(EventActionType.Repost)}
        >
          <RepeatOutlined />
        </IconButton>
        <Typography variant="caption">87</Typography>
      </Box>
      <Box className="flex flex-row gap-2 items-center">
        <IconButton
          className="flex !text-contrast-secondary"
          size="small"
          onClick={handleClickAction(EventActionType.Quote)}
        >
          <FormatQuoteOutlined />
        </IconButton>
        <Typography variant="caption">5</Typography>
      </Box>
      <Box className="flex flex-row gap-2 items-center">
        <IconButton
          className="flex !text-contrast-secondary"
          size="small"
          onClick={handleClickAction(EventActionType.Comment)}
        >
          <CommentOutlined />
        </IconButton>
        <Typography variant="caption">455</Typography>
      </Box>
      <Box className="flex flex-row gap-2 items-center">
        <IconButton
          className="flex"
          color="primary"
          size="small"
          onClick={handleClickAction(EventActionType.Zap)}
        >
          <ElectricBoltOutlined />
        </IconButton>
        <Typography variant="caption">643k</Typography>
      </Box>
    </Box>
  )
}

export default NoteActionBar
