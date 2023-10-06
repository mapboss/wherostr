import { Box, Fade, FadeProps, LinearProgress, Paper } from '@mui/material'
import { ForwardRefRenderFunction, forwardRef } from 'react'
import Image from 'next/image'
// https://rightshift.to/wp-content/uploads/2022/12/logo_Right_Shift_BGorange-09.png

interface SplashScreenProps extends Omit<FadeProps, 'children'> {}
const SplashScreen: ForwardRefRenderFunction<HTMLElement, SplashScreenProps> = (
  props,
  ref,
) => {
  return (
    <Fade {...props} ref={ref}>
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

export default forwardRef(SplashScreen)
