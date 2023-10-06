import { Home, Map } from '@mui/icons-material'
import { BottomNavigation, BottomNavigationAction } from '@mui/material'

const BottomActions = () => {
  return (
    <BottomNavigation value={0} showLabels>
      <BottomNavigationAction label="Home" color="white" icon={<Home />} />
      <BottomNavigationAction label="Map" color="white" icon={<Map />} />
    </BottomNavigation>
  )
}

export default BottomActions
