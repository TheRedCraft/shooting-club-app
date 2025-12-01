# Club Configuration

## Environment Variables

Add the following variables to your `.env.local` file to customize the club name and logo:

```env
# Club Name (displayed in navigation, login, register pages, etc.)
NEXT_PUBLIC_CLUB_NAME=Your Club Name

# Club Logo (path to logo image)
# Option 1: Local file in public folder (e.g., '/logo.png')
NEXT_PUBLIC_CLUB_LOGO=/logo.png

# Option 2: External URL
NEXT_PUBLIC_CLUB_LOGO=https://example.com/logo.png

# Club Description (for metadata)
NEXT_PUBLIC_CLUB_DESCRIPTION=Your club description
```

## Logo Requirements

- **Local files**: Place your logo in the `public` folder and reference it with a path starting with `/` (e.g., `/logo.png`)
- **External URLs**: Use the full URL (e.g., `https://example.com/logo.png`)
- **Format**: PNG, SVG, or JPG recommended
- **Size**: Recommended size is 24-48px for navigation, larger for login/register pages

## Default Values

If environment variables are not set, the following defaults are used:
- **Name**: "Shooting Club"
- **Logo**: None (emoji icon 🎯 is displayed instead)
- **Description**: "Analytics platform for shooting clubs with Meyton integration"

## Usage

The club name and logo are automatically used in:
- Navigation bar
- Login page
- Register page
- Page title (browser tab)
- Mobile drawer menu

The name is the same in both German and English languages.

