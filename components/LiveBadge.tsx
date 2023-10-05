import { Paper, Typography } from '@mui/material'

const LiveBadge = () => {
  return (
    <Paper sx={{ bgcolor: 'primary.main', px: 1, py: 0.5 }}>
      <Typography variant="body2" fontWeight="bold">
        Live
      </Typography>
    </Paper>
  )
}

export default LiveBadge
