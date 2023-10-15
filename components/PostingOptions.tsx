import { AddPhotoAlternate, LocationOff, LocationOn } from '@mui/icons-material'
import { IconButton, IconButtonProps } from '@mui/material'
import { FC, useCallback, useState } from 'react'
import { DropzoneProps, useDropzone } from 'react-dropzone'

export interface PostingOptionsValues {
  image?: File[]
  location: boolean
}

export interface PostingOptionsProps {
  slotProps?: {
    iconButton?: IconButtonProps
    imageButton?: IconButtonProps
    locationButton?: IconButtonProps
    dropzone?: DropzoneProps
  }
  onChange?: (
    name: keyof PostingOptionsValues,
    values: PostingOptionsValues,
  ) => void
}
export const PostingOptions: FC<PostingOptionsProps> = ({
  slotProps,
  onChange,
}) => {
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
    ...slotProps?.dropzone,
    noDrag: true,
    onDrop: handleDrop,
  })

  return (
    <>
      <IconButton
        {...getRootProps({
          ...slotProps?.iconButton,
          ...slotProps?.imageButton,
        })}
      >
        <AddPhotoAlternate className="opacity-70" />
      </IconButton>
      <IconButton
        {...slotProps?.iconButton}
        {...slotProps?.locationButton}
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
