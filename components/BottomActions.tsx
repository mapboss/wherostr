import { AppContext, EventActionType } from '@/contexts/AppContext'
import { Add, Draw, Home, Map, Search } from '@mui/icons-material'
import { BottomNavigation, BottomNavigationAction, Fab } from '@mui/material'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useContext, useState } from 'react'

const BottomActions = () => {
  const { setEventAction } = useContext(AppContext)
  const router = useRouter()
  const pathname = usePathname()
  const query = useSearchParams()
  const hasMap = query.get('map') === '1'
  const hasSearch = !!query.get('keyword')
  const [value, setValue] = useState(
    hasMap ? 'map' : hasSearch ? 'search' : 'home',
  )

  const handleClickPost = useCallback(() => {
    setEventAction({
      type: EventActionType.Create,
    })
  }, [setEventAction])

  return (
    <>
      <BottomNavigation
        value={hasMap ? 'map' : value}
        showLabels={false}
        sx={{ height: 48 }}
        onChange={(_, value) => {
          setValue(value)
          const keyword = query.get('keyword') || ''
          if (value === 'map') {
            router.replace(`${pathname}?keyword=${keyword}&map=1`)
          } else if (value === 'search') {
            router.replace(`${pathname}?keyword=${keyword}`)
          } else {
            router.replace(`${pathname}?keyword=${keyword}`)
          }
        }}
      >
        <BottomNavigationAction value="home" icon={<Home />} />
        {/* <BottomNavigationAction
          value="search"
          label="Search"
          icon={<Search />}
        /> */}
        <BottomNavigationAction value="map" icon={<Map />} />
      </BottomNavigation>
      <Fab
        className="!absolute !bg-gradient-primary !z-40 bottom-14 right-4"
        size="medium"
        onClick={handleClickPost}
      >
        <Draw className="text-[white]" />
      </Fab>
    </>
  )
}

export default BottomActions
