import axios from 'axios'

export const upload = async (file: File) => {
  const data = new FormData()
  data.append('image', file)
  return axios
    .post('https://api.imgur.com/3/image', data, {
      headers: { Authorization: 'Client-ID e4f58fc81daec99' },
    })
    .then((res) => res.data)
}
