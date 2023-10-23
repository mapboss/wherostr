'use client'

import DrawerMenu from '@/components/DrawerMenu'
import EventActionModal from '@/components/EventActionModal'
import ProfileActionModal from '@/components/ProfileActionModal'
import UserBar from '@/components/UserBar'
import { useUser } from '@/hooks/useAccount'
import { useAction } from '@/hooks/useApp'
import { Box, Toolbar } from '@mui/material'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useUser()
  const { eventAction, profileAction } = useAction()
  return (
    <>
      <Toolbar>
        {user?.hexpubkey ? (
          <DrawerMenu hexpubkey={user.hexpubkey} />
        ) : (
          <UserBar />
        )}
      </Toolbar>
      {children}
      {!!eventAction && (
        <Box className="fixed inset-0 backdrop-blur z-50 flex items-center justify-center overflow-hidden p-2">
          <Box className="h-full w-full md:max-w-2xl max-h-full overflow-hidden">
            <EventActionModal />
          </Box>
        </Box>
      )}
      {!!profileAction && (
        <Box className="fixed inset-0 backdrop-blur z-50 flex items-center justify-center overflow-hidden p-2">
          <Box className="h-full w-full md:max-w-2xl max-h-full overflow-hidden">
            <ProfileActionModal />
          </Box>
        </Box>
      )}
    </>
  )
}
