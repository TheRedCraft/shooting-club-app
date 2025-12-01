// Club configuration from environment variables
export const clubConfig = {
  name: process.env.NEXT_PUBLIC_CLUB_NAME || 'Shooting Club',
  logo: process.env.NEXT_PUBLIC_CLUB_LOGO || null, // Path to logo image (e.g., '/logo.png')
  description: process.env.NEXT_PUBLIC_CLUB_DESCRIPTION || 'Analytics platform for shooting clubs with Meyton integration',
};

