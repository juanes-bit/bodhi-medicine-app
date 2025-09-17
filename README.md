# Bodhi Medicine - React Native App

A comprehensive learning platform built with Expo and React Native for Bodhi Medicine courses.

## Features

- 🎓 Course catalog and lesson player
- 🔐 JWT authentication with WordPress backend
- 📱 Native video player with resume functionality
- 💳 Stripe checkout integration
- 🔔 Push notifications
- 🌐 Multi-language support (ES/EN)
- 🎨 Beautiful UI with NativeWind (Tailwind CSS)

## Tech Stack

- **Framework**: Expo SDK 52+ with TypeScript
- **Navigation**: Expo Router
- **State Management**: Zustand + React Query
- **UI**: NativeWind (Tailwind CSS) + Lucide icons
- **Video**: Expo AV
- **Storage**: Expo SecureStore + MMKV
- **Forms**: React Hook Form + Zod validation

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator / Android Emulator

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Copy environment variables:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. Start the development server:
   \`\`\`bash
   npm start
   \`\`\`

### Environment Variables

Create a `.env` file with the following variables:

\`\`\`env
EXPO_PUBLIC_API=https://staging.bodhimedicine.com
EXPO_PUBLIC_CLOUDINARY_CLOUD=daayxpmsz
EXPO_PUBLIC_LOCALE_DEFAULT=es
EXPO_PUBLIC_SENTRY_DSN=
\`\`\`

## Building

### Staging Build
\`\`\`bash
npm run build:staging
\`\`\`

### Production Build
\`\`\`bash
npm run build:production
\`\`\`

## Deep Links

The app supports the following deep link schemes:

- `bodhi://course/:id` - Open course detail
- `bodhi://lesson/:id` - Open lesson player
- `bodhi://checkout/success` - Handle successful payment

## Project Structure

\`\`\`
app/                    # Expo Router pages
├── (tabs)/            # Tab navigation
├── auth/              # Authentication screens
├── courses/           # Course and lesson screens
└── paywall/           # Payment screens

src/
├── api/               # API client and types
├── components/        # Reusable components
├── hooks/             # Custom hooks
├── lib/               # Utilities
├── store/             # Zustand stores
└── theme/             # Design tokens
\`\`\`

## API Integration

The app integrates with WordPress + Bodhi API plugin:

- **Base URL**: `${EXPO_PUBLIC_API}/wp-json`
- **Auth**: JWT tokens via `jwt-auth/v1/*`
- **Courses**: Custom endpoints via `bodhi/v1/*`
- **Media**: Cloudinary integration for optimized images/videos

## Contributing

1. Follow TypeScript strict mode
2. Use ESLint configuration
3. Test on both iOS and Android
4. Ensure accessibility compliance (AA level)

## License

Private - Bodhi Medicine
# bodhi-medicine-app
