import { Home, Map, Search } from '@mui/icons-material'
import { BottomNavigation, BottomNavigationAction } from '@mui/material'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const BottomActions = () => {
  const router = useRouter()
  const pathname = usePathname()
  const query = useSearchParams()
  const hasMap = query.get('map') === '1'
  const [value, setValue] = useState(0)

  useEffect(() => {
    setValue(hasMap ? 1 : 0)
  }, [hasMap])

  return (
    <BottomNavigation
      value={value}
      showLabels
      onChange={(_, value) => {
        setValue(value)
        const keyword = query.get('keyword') || ''
        if (value === 1) {
          router.replace(`${pathname}?keyword=${keyword}&map=1`)
        } else {
          router.replace(`${pathname}?keyword=${keyword}`)
        }
      }}
    >
      <BottomNavigationAction label="Home" icon={<Home />} />
      {/* <BottomNavigationAction label="Search" icon={<Search />} /> */}
      <BottomNavigationAction label="Map" icon={<Map />} />
    </BottomNavigation>
  )
}

export default BottomActions
