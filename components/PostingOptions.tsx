import { accept } from '@/utils/upload'
import {
  AddPhotoAlternate,
  LocationOff,
  LocationOn,
  MemoryOutlined,
} from '@mui/icons-material'
import { IconButton, IconButtonProps } from '@mui/material'
import { FC, useCallback, useState } from 'react'
import { DropzoneProps, useDropzone } from 'react-dropzone'

export interface PostingOptionsValues {
  image?: File[]
  location: boolean
  pow: boolean
}

export interface PostingOptionsProps {
  disabled?: boolean
  slotProps?: {
    iconButton?: IconButtonProps
    imageButton?: IconButtonProps
    locationButton?: IconButtonProps
    powButton?: IconButtonProps
    dropzone?: DropzoneProps
  }
  onChange?: (
    name: keyof PostingOptionsValues,
    values: PostingOptionsValues,
  ) => void
}
export const PostingOptions: FC<PostingOptionsProps> = ({
  disabled,
  slotProps,
  onChange,
}) => {
  const [values, setValues] = useState<PostingOptionsValues>({
    location: false,
    pow: false,
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

  const { getRootProps, getInputProps } = useDropzone({
    ...slotProps?.dropzone,
    accept: accept,
    noDrag: true,
  })

  return (
    <>
      <IconButton
        {...getRootProps({
          ...slotProps?.iconButton,
          ...slotProps?.imageButton,
          disabled,
        })}
      >
        <input {...getInputProps()} />
        <AddPhotoAlternate className="opacity-70" />
      </IconButton>
      <IconButton
        {...slotProps?.iconButton}
        {...slotProps?.locationButton}
        disabled={disabled}
        color={values.location ? 'secondary' : 'default'}
        onClick={handleClick('location')}
      >
        {values.location ? (
          <LocationOn />
        ) : (
          <LocationOff className="opacity-70" />
        )}
      </IconButton>
      <IconButton
        {...slotProps?.iconButton}
        {...slotProps?.powButton}
        disabled={disabled}
        color={values.pow ? 'secondary' : 'default'}
        onClick={handleClick('pow')}
      >
        {values.pow ? (
          <MemoryOutlined />
        ) : (
          <MemoryOutlined className="opacity-70" />
        )}
      </IconButton>
    </>
  )
}
