# Bite Back - Crowdsourced Calories-Per-Dollar Mobile App

A mobile app that empowers budget-conscious consumers to maximize nutritional value from restaurant meals by calculating and ranking "calories per dollar" based on receipt data.

## Tagline
**"More bread for your bread"** - Emphasizing both financial savings and nutritional bang-for-buck.

## Features

### Core Functionality
- **Receipt Scanning**: Capture restaurant receipts via camera or gallery
- **Calories-Per-Dollar Calculation**: Automatic value scoring (calories / total spent)
- **Heat Map Visualization**: Color-coded value indicators:
  - 🟢 Green (150+ cals/dollar) - Excellent Deal
  - 🟡 Amber (50-150 cals/dollar) - Fair Value
  - 🔴 Red (<50 cals/dollar) - Poor Value

### User Features
- **Authentication**: Secure email/password registration and login
- **Scan History**: Track all previous receipt scans
- **Leaderboards**: Real-time rankings by city and all-time scores
- **Badge System**: Gamified achievements (First Bite, Value Wolf, Deal Hunter, etc.)
- **User Profiles**: Display stats, badges, and personal history
- **Dashboard**: Quick overview of scan count, best score, and recent meals

## Tech Stack

### Frontend
- **React Native** with Expo for cross-platform compatibility
- **Expo Router** for file-based navigation with tabs layout
- **React Context** for state management
- **AsyncStorage** for offline-first data persistence
- **Lucide Icons** for UI components

### Backend
- **Supabase** PostgreSQL database with Row Level Security
- **Supabase Auth** for email/password authentication
- **Supabase Realtime** for leaderboard updates

### Styling
- Custom theme system with teal accent color (#00D9A3)
- Matte black background (#0F0F0F)
- 8px spacing grid system
- Semantic color palette (success, warning, danger, info)

## Project Structure

```
/app
  /(auth)/              # Authentication screens
    _layout.tsx
    index.tsx           # Login screen
    signup.tsx          # Registration screen
  /(tabs)/              # Main app tabs
    _layout.tsx         # Tab navigation
    index.tsx           # Home dashboard
    scan.tsx            # Receipt camera
    leaderboard.tsx     # Rankings
    profile.tsx         # User profile
    results.tsx         # Receipt details
  _layout.tsx           # Root layout with auth
  +not-found.tsx        # 404 screen

/components             # Reusable UI components
  Button.tsx
  SplashScreen.tsx

/contexts               # React Context providers
  AuthContext.tsx       # Auth state and methods

/lib                    # Utilities and services
  supabase.ts          # Supabase client
  api.ts               # API integrations
  utils.ts             # Helper functions

/constants              # App constants
  colors.ts            # Color palette and theme

/types                  # TypeScript type definitions
  index.ts
  env.d.ts
```

## Getting Started

### Prerequisites
- Node.js 16+
- Expo CLI (`npm install -g eas-cli`)
- Supabase account (configured in `.env`)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

3. Start development server:
```bash
npm run dev
```

4. Open in Expo Go app or web browser

### Build for Production

Web:
```bash
npm run build:web
```

iOS/Android:
```bash
eas build --platform ios
eas build --platform android
```

## Database Schema

### Core Tables
- **users**: User profiles and statistics
- **receipts**: Scanned receipts with nutritional data
- **line_items**: Individual items from receipts
- **item_medians**: Crowdsourced price aggregates

### Social & Gamification
- **posts**: Shared receipts on social feed
- **user_badges**: User achievement tracking
- **badges**: Badge definitions
- **item_tags**: Crowdsourced ingredient tags

All tables have Row Level Security enabled for user privacy.

## API Endpoints (Future)

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Receipts
- `POST /receipts` - Submit new receipt
- `GET /receipts/:id` - Get receipt details
- `GET /receipts/user/:userId` - User's receipt history

### Leaderboards
- `GET /leaderboards/city/:city` - City rankings
- `GET /leaderboards/global` - Global rankings

### Nutrition
- `GET /nutrition/item/:name` - Lookup nutrition data
- `POST /nutrition/batch` - Batch lookup

## MVP Features (Current)

✅ User authentication (email/password)
✅ Receipt camera capture
✅ Calories-per-dollar calculation
✅ Heat map visualization
✅ Receipt details entry
✅ Scan history
✅ User profiles
✅ Leaderboards
✅ Badge system
✅ Dark theme UI

## Future Enhancements

- OCR integration (Tesseract.js / Google Vision)
- Nutritionix API integration
- Advanced food item matching
- Social sharing to Instagram/TikTok
- Real-time multi-user synchronization
- Predictive price analysis
- Premium subscription tier
- Personalized recommendations
- Maps integration for location-based discovery
- Crowdsourced restaurant reviews

## Security

- Row Level Security (RLS) on all database tables
- Secure authentication with Supabase Auth
- No sensitive data stored client-side
- API rate limiting (future)
- Data encryption in transit

## Performance

- Offline-first architecture with AsyncStorage
- Optimized database queries with indexes
- Lazy-loaded screens
- Image compression for receipts
- Real-time updates via Supabase subscriptions

## Compliance

- GDPR-ready with data export/deletion
- CCPA-compliant opt-in data sharing
- No third-party tracking
- Transparent data usage policies

## License

Proprietary - Bite Back Inc.

## Contact

For support or inquiries, contact: support@biteback.app

---

Built with ❤️ for budget-conscious eaters everywhere.
