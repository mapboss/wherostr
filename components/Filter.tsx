'use client'
import {
  BaseTextFieldProps,
  TextFieldProps,
  IconButton,
  Paper,
} from '@mui/material'
import { FC, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import _ from 'lodash'
import SearchBox from './SearchBox'
import { Close, Search } from '@mui/icons-material'
import classNames from 'classnames'
import { NDKUser } from '@nostr-dev-kit/ndk'

export interface FilterProps extends BaseTextFieldProps {
  className?: string
  user?: NDKUser
  InputProps?: TextFieldProps['InputProps']
}

const Filter: FC<FilterProps> = ({ className, user, ...props }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [showSearch, setShowSearch] = useState(false)
  const querySearch = searchParams.get('q') || ''
  const showMap = searchParams.get('map') || ''

  return (
    <Paper
      className={classNames(
        'flex !flex-none items-center justify-end !shadow-none',
        className,
        {
          'left-28': !user && showSearch,
          'left-16': !!user && showSearch,
          'absolute right-3 z-50 bg-[inherit]': showSearch,
        },
      )}
    >
      {showSearch && (
        <SearchBox
          placeholder="Search by hashtag or place"
          name="search"
          size="small"
          margin="dense"
          onChange={(value) => {
            router.push(`${pathname}?q=${value}&map=${showMap}`)
          }}
          value={querySearch}
        />
      )}
      <IconButton
        className="min-w-[40px]"
        onClick={() => setShowSearch((prev) => !prev)}
      >
        {showSearch ? <Close /> : <Search />}
      </IconButton>
    </Paper>
  )
}

export default Filter
