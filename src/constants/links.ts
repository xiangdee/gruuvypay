export const isDev = process.env.EXPO_ENVIRONMENT ? process.env.EXPO_ENVIRONMENT : false

export const ApiLink =isDev ? (process.env.EXPO_PUBLIC_API_URL_DEV ) :
 (process.env.EXPO_PUBLIC_API_URL )

export const siteLink =isDev ? (process.env.EXPO_PUBLIC_SITE_URL_DEV ) :
 (process.env.EXPO_PUBLIC_SITE_URL )

export const supportEmail = 'info@gruuvypay.com'
export const twitterLink = 'https://twitter.com/gruuvypay'
export const instagramLink = 'https://instagram.com/gruuvypay'

