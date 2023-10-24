export const MILLISECONDS = 1000
export const DAY_IN_MILLISECONDS = MILLISECONDS * 60 * 60 * 24
export const DAY = 60 * 60 * 24
export const WEEK = DAY * 7
export const MONTH = DAY * 30
export const YEAR = MONTH * 12

export const unixNow = () => Math.round(Date.now() / MILLISECONDS)
