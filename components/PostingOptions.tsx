import { AddPhotoAlternate, LocationOff, LocationOn } from '@mui/icons-material'
import { IconButton } from '@mui/material'
import { FC, useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

export interface PostingOptionsValues {
  image?: File[]
  location: boolean
}

export interface PostingOptionsProps {
  onChange?: (
    name: keyof PostingOptionsValues,
    values: PostingOptionsValues,
  ) => void
}
export const PostingOptions: FC<PostingOptionsProps> = ({ onChange }) => {
  const [values, setValues] = useState<PostingOptionsValues>({
    location: false,
  })

  const handleClick = useCallback(
    (name: keyof PostingOptionsValues) => () => {
      setValues((prev) => {
        const d = { ...prev, [name]: !prev[name] }
        onChange?.(name, d)
        return d
      })
    },
    [onChange],
  )

  const handleDrop = useCallback(
    (files: File[]) => {
      onChange?.('image', { ...values, image: files })
    },
    [onChange, values],
  )

  const { getRootProps } = useDropzone({
    noDrag: true,
    onDrop: handleDrop,
  })

  return (
    <>
      <IconButton {...getRootProps()}>
        <AddPhotoAlternate className="opacity-70" />
      </IconButton>
      <IconButton
        color={values.location ? 'secondary' : 'default'}
        onClick={handleClick('location')}
      >
        {values.location ? (
          <LocationOn />
        ) : (
          <LocationOff className="opacity-70" />
        )}
      </IconButton>
    </>
  )
}
