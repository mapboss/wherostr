import { Box, Fade, FadeProps, LinearProgress, Paper } from '@mui/material'
import { FC } from 'react'

interface SplashScreenProps extends Omit<FadeProps, 'children'> {}
const SplashScreen: FC<SplashScreenProps> = (props) => {
  return (
    <Fade {...props}>
      <Paper className="fixed inset-0 z-50 flex justify-center items-center flex-col">
        {/* <Box className="relative w-[128px] h-[128px] rounded-full">
          <Image
            fill={true}
            src={
              'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlflmCK7uOqzCopIa-FCtjL_ALXXX8IzAtLgPF3D9c&s'
            }
            alt="Logo"
            objectFit="contain"
          />
        </Box> */}
        <Box my={2} />
        <LinearProgress className="min-w-[240px]" />
      </Paper>
    </Fade>
  )
}

export default SplashScreen
