'use client'
import { TaggedNostrEvent } from '@snort/system'
import { Box, IconButton, Typography } from '@mui/material'
import {
  CommentOutlined,
  ElectricBoltOutlined,
  EmojiEmotionsOutlined,
  RepeatOutlined,
} from '@mui/icons-material'

const NoteActionBar = ({ event }: { event: TaggedNostrEvent }) => {
  return (
    <Box className="text-contrast-secondary grid grid-flow-col grid-rows-1 grid-cols-4 gap-2">
      <Box className="flex flex-row gap-2 items-center">
        <IconButton className="flex !text-contrast-secondary" size="small">
          <EmojiEmotionsOutlined />
        </IconButton>
        <Typography variant="caption">12k</Typography>
      </Box>
      <Box className="flex flex-row gap-2 items-center">
        <IconButton className="flex !text-contrast-secondary" size="small">
          <CommentOutlined />
        </IconButton>
        <Typography variant="caption">455</Typography>
      </Box>
      <Box className="flex flex-row gap-2 items-center">
        <IconButton className="flex !text-contrast-secondary" size="small">
          <RepeatOutlined />
        </IconButton>
        <Typography variant="caption">87</Typography>
      </Box>
      <Box className="flex flex-row gap-2 items-center">
        <IconButton className="flex" color="primary" size="small">
          <ElectricBoltOutlined />
        </IconButton>
        <Typography variant="caption">643k</Typography>
      </Box>
    </Box>
  )
}

export default NoteActionBar
