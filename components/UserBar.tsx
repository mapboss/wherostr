'use client'
import {
  ChevronLeft,
  ContentPaste,
  Key,
  Login,
  Logout,
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  ButtonProps,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ProfileChip from '@/components/ProfileChip'
import classNames from 'classnames'
import { useAccount } from '@/hooks/useAccount'
import { LoadingButton } from '@mui/lab'
import { SignInType } from '@/contexts/AccountContext'
import { useForm } from 'react-hook-form'
// import { nip19 } from 'nostr-tools'

const UserBar = ({ className }: { className?: string }) => {
  const { register, handleSubmit, setValue, reset } = useForm()
  const { user, signing, signIn, signOut } = useAccount()
  const [open, setOpen] = useState(false)
  const [loginType, setLoginType] = useState<SignInType>()
  const nostrRef = useRef<typeof window.nostr>(
    typeof window !== 'undefined' ? window.nostr : undefined,
  )
  nostrRef.current = typeof window !== 'undefined' ? window.nostr : undefined

  const signedIn = useMemo(() => {
    return !!user
  }, [user])

  useEffect(() => {
    reset()
  }, [loginType])

  const handleClickSignIn = useCallback(
    async (type: SignInType) => {
      const user = await signIn(type)
      if (!user) return
      setOpen(false)
    },
    [signIn],
  )

  const handleClickSignOut = useCallback(() => {
    signOut()
  }, [signOut])

  const _handleSubmit = useCallback(
    async (values: any) => {
      let user
      if (loginType === 'nsec') {
        user = await signIn(loginType, values.nsec)
      } else if (loginType === 'npub') {
        user = await signIn(loginType, values.npub)
      }
      if (!user) return
      setOpen(false)
    },
    [handleClickSignIn, loginType],
  )

  return (
    <Box
      className={classNames(
        'grid items-center rounded-bl-2xl',
        { 'bg-gradient-primary': signedIn },
        className,
      )}
    >
      {user?.hexpubkey ? (
        <Box className="flex items-center gap-2 p-1">
          <ProfileChip hexpubkey={user?.hexpubkey} />
          <IconButton size="small" onClick={handleClickSignOut}>
            <Logout />
          </IconButton>
        </Box>
      ) : (
        <LoadingButton
          loading={signing}
          className="bg-gradient-primary"
          variant="contained"
          onClick={() => setOpen(true)}
          startIcon={<Login />}
          loadingPosition="start"
        >
          Login
        </LoadingButton>
      )}

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false)
          setLoginType(undefined)
        }}
        fullWidth
        maxWidth={'xs'}
        component="form"
        // PaperProps={{
        //   className: classNames('transition-all', {
        //     '!bg-error-dark': loginType === 'nsec',
        //   }),
        // }}
        onSubmit={handleSubmit(_handleSubmit)}
      >
        {!!loginType && (
          <DialogTitle>
            <IconButton
              className="!mr-2"
              onClick={() => setLoginType(undefined)}
            >
              <ChevronLeft />
            </IconButton>
            {loginType === 'nsec'
              ? 'Login with Private Key (insecure)'
              : 'Login as read-only'}
          </DialogTitle>
        )}
        <DialogContent>
          {!loginType ? (
            <>
              <Box className="flex flex-col items-center justify-center">
                {!!nostrRef.current && (
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    className="!min-w-[272px]"
                    disabled={signing}
                    onClick={() => handleClickSignIn('nip7')}
                  >
                    Login with Nostr extension
                  </Button>
                )}
                <Box my={0.5} />
                <Button
                  variant="outlined"
                  color="secondary"
                  size="large"
                  className="!min-w-[272px]"
                  disabled={signing}
                  onClick={() => setLoginType('nsec')}
                >
                  Login with Private Key (insecure)
                </Button>
                <Box my={0.5} />
                <Button
                  variant="outlined"
                  color="secondary"
                  size="large"
                  className="!min-w-[272px]"
                  disabled={signing}
                  onClick={() => setLoginType('npub')}
                >
                  Login as read-only
                </Button>
              </Box>
              <Divider
                sx={{ my: 2, color: signing ? 'text.disabled' : undefined }}
              >{`Don't have an account ?`}</Divider>
              <Box className="flex flex-col items-center justify-center">
                <Button
                  variant="outlined"
                  size="large"
                  color="inherit"
                  disabled={signing}
                >
                  Create an account
                </Button>
              </Box>
            </>
          ) : loginType === 'nsec' ? (
            <>
              <Alert severity="warning">
                Using private keys is insecure You should use a browser
                extension like Alby, nostr-keyx or Nos2x
              </Alert>
              <Typography>Enter user private key (nsec)</Typography>
              <TextField
                fullWidth
                margin="dense"
                placeholder="nsec or hex"
                type="password"
                color="secondary"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Key className="text-contrast-secondary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <IconButton
                      onClick={async () => {
                        const text = await navigator.clipboard.readText()
                        setValue('nsec', text)
                      }}
                    >
                      <ContentPaste />
                    </IconButton>
                  ),
                }}
                disabled={signing}
                {...register('nsec', {
                  required: true,
                })}
              />
            </>
          ) : loginType === 'npub' ? (
            <>
              <Typography>Enter user npub or NIP-05</Typography>
              <TextField
                fullWidth
                margin="dense"
                placeholder="npub1 or NIP-05"
                color="secondary"
                helperText={
                  <>
                    eg. npub1
                    <br />
                    eg. user@domain.com
                  </>
                }
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={async () => {
                        const text = await navigator.clipboard.readText()
                        setValue('npub', text)
                      }}
                    >
                      <ContentPaste />
                    </IconButton>
                  ),
                }}
                disabled={signing}
                {...register('npub', {
                  required: true,
                })}
              />
            </>
          ) : undefined}
        </DialogContent>
        {!!loginType && (
          <DialogActions>
            <Button
              fullWidth
              disabled={signing}
              size="large"
              sx={{
                color: 'background.paper',
                bgcolor: 'grey.500',
                '&:hover': { bgcolor: 'grey.600' },
              }}
              type="submit"
            >
              Login
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  )
}

export default UserBar

export const GreyButton: FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <Button
      {...props}
      // variant="contained"
      // sx={{
      //   color: 'background.paper',
      //   bgcolor: 'grey.500',
      //   '&:hover': {
      //     bgcolor: 'grey.600',
      //   },
      // }}
    >
      {children}
    </Button>
  )
}
