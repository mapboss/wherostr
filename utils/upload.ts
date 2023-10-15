import axios, { AxiosResponse } from 'axios'

export const upload = async (file: File[]): Promise<NostrBuildResponse> => {
  const data = new FormData()
  file.forEach((d, i) => data.append(`file[${i}]`, d, d.name))
  return axios
    .post<any, AxiosResponse<NostrBuildResponse>>(
      'https://nostr.build/api/v2/upload/files',
      data,
    )
    .then((res) => res.data)
}

export const accept = {
  'image/png': ['.png'],
  'image/jpg': ['.jpg', '.jpeg'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'audio/mpeg': ['.mp3'],
}

export interface NostrBuildResponseData {
  input_name: string
  name: string
  url: string
  thumbnail: string
  responsive: Record<'240p' | '360p' | '480p' | '720p' | '1080p', string>
  blurhash: string
  sha256: string
  type: 'picture' | 'video'
  mime: string
  size: number
  // metadata: {
  //   'date:create': '2023-10-15T02:29:26+00:00'
  //   'date:modify': '2023-10-15T02:29:26+00:00'
  //   'icc:copyright': 'Google Inc. 2016'
  //   'icc:description': 'sRGB Transfer with Display P3 Gamut'
  //   'jpeg:colorspace': '2'
  //   'jpeg:sampling-factor': '2x2,1x1,1x1'
  // }
  dimensions: {
    width: number
    height: number
  }
}
export interface NostrBuildResponse {
  status: 'success' | 'error'
  message: string
  data: NostrBuildResponseData[]
}
