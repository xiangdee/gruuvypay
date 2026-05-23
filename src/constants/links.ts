export const isDev = process.env.EXPO_PUBLIC_ENVIRONMENT ? process.env.EXPO_PUBLIC_ENVIRONMENT=== 'development' : false


export const ApiLink =isDev ? (process.env.EXPO_PUBLIC_API_URL_DEV ) :
 (process.env.EXPO_PUBLIC_API_URL )
 

export const siteLink =isDev ? (process.env.EXPO_PUBLIC_SITE_URL_DEV ) :
 (process.env.EXPO_PUBLIC_SITE_URL )

 export const S3Link ='https://s3.eu-central-003.backblazeb2.com/gruuvypay'

export const supportEmail = 'info@gruuvypay.com'
export const twitterLink = 'https://twitter.com/gruuvypay'
export const instagramLink = 'https://www.instagram.com/gruuvypay.ng'

export const tiktokLink = 'https://www.tiktok.com/@gruuvypay'
export const whatsappLink = 'https://wa.me/2347082411502'

