const { hairlineWidth } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        'poppins-thin': ['Poppins_100Thin'],
        'poppins-thin-italic': ['Poppins_100Thin_Italic'],
        'poppins-extralight': ['Poppins_200ExtraLight'],
        'poppins-extralight-italic': ['Poppins_200ExtraLight_Italic'],
        'poppins-light': ['Poppins_300Light'],
        'poppins-light-italic': ['Poppins_300Light_Italic'],
        'poppins-regular': ['Poppins_400Regular'],
        'poppins-regular-italic': ['Poppins_400Regular_Italic'],
        'poppins-medium': ['Poppins_500Medium'],
        'poppins-medium-italic': ['Poppins_500Medium_Italic'],
        'poppins-semibold': ['Poppins_600SemiBold'],
        'poppins-semibold-italic': ['Poppins_600SemiBold_Italic'],
        'poppins-bold': ['Poppins_700Bold'],
        'poppins-bold-italic': ['Poppins_700Bold_Italic'],
        'poppins-extrabold': ['Poppins_800ExtraBold'],
        'poppins-extrabold-italic': ['Poppins_800ExtraBold_Italic'],
        'poppins-black': ['Poppins_900Black'],
        'poppins-black-italic': ['Poppins_900Black_Italic'],
        'inter-thin': ['Inter_100Thin'],
        'inter-thin-italic': ['Inter_100Thin_Italic'],
        'inter-extralight': ['Inter_200ExtraLight'],
        'inter-extralight-italic': ['Inter_200ExtraLight_Italic'],
        'inter-light': ['Inter_300Light'],
        'inter-light-italic': ['Inter_300Light_Italic'],
        'inter-regular': ['Inter_400Regular'],
        'inter-regular-italic': ['Inter_400Regular_Italic'],
        'inter-medium': ['Inter_500Medium'],
        'inter-medium-italic': ['Inter_500Medium_Italic'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-semibold-italic': ['Inter_600SemiBold_Italic'],
        'inter-bold': ['Inter_700Bold'],
        'inter-bold-italic': ['Inter_700Bold_Italic'],
        'inter-extrabold': ['Inter_800ExtraBold'],
        'inter-extrabold-italic': ['Inter_800ExtraBold_Italic'],
        'inter-black': ['Inter_900Black'],
        'inter-black-italic': ['Inter_900Black_Italic'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};
