import { Box, BoxProps, Fade, Typography } from '@mui/material'
import { HTMLProps, useCallback, useEffect, useState } from 'react'
import ReactPlayer from 'react-player'

export enum VideoStatus {
  Online = 'online',
  Offline = 'offline',
}

// copied from zap.stream
export function LiveVideoPlayer({
  stream,
  autoPlay,
  poster,
  muted,
  ...props
}: Omit<BoxProps, 'children'> & {
  stream?: string
  autoPlay?: boolean
  poster?: string
  muted?: HTMLProps<HTMLVideoElement>['muted']
}) {
  const [status, setStatus] = useState<VideoStatus>(VideoStatus.Online)
  const [url, setUrl] = useState<string>()

  const load = useCallback((url?: string) => {
    setUrl(undefined)
    setUrl(url)
  }, [])

  useEffect(() => {
    load(stream)
  }, [load, stream])

  return (
    <Box {...props}>
      <Fade in={status === VideoStatus.Offline}>
        <Box className="absolute inset-0 bg-[black] bg-opacity-50 flex justify-center items-center">
          <Typography variant="h4" fontWeight="bold" color="text.secondary">
            OFFLINE
          </Typography>
        </Box>
      </Fade>
      <ReactPlayer
        url={url}
        controls={status !== VideoStatus.Offline}
        playing={autoPlay}
        config={{ file: { attributes: { poster } } }}
        muted={muted}
        width="100%"
        height="100%"
        style={{ aspectRatio: '16/9', flex: 1, maxHeight: '100%' }}
        playsinline
        onStart={() => {
          if (status === VideoStatus.Offline) {
            setStatus(VideoStatus.Online)
            load(stream)
          }
        }}
        onError={(error: any, data: any) => {
          const errorType = data?.type
          if (errorType === 'networkError' && data?.fatal) {
            setStatus(VideoStatus.Offline)
          }
        }}
      />
    </Box>
  )
}
