# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a legal consultation mobile app built with React Native and Expo. The app connects users with legal advisors through a chat interface, provides location-based law office search, and includes subscription management.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (shows QR code for Expo Go)
npx expo start

# Start on specific platform
npx expo start --android
npx expo start --ios
npx expo start --web

# Lint code
npm run lint
```

## Architecture

### Routing (Expo Router)

The app uses **Expo Router** with file-based routing in the `app/` directory:

- `app/_layout.tsx` - Root layout wrapping app with AuthProvider and ChatProvider
- `app/(tabs)/_layout.tsx` - Main app layout using Drawer navigation with custom sidebar
- `app/(tabs)/index.tsx` - Home screen showing recent consultations
- `app/(tabs)/chat/[id].tsx` - Dynamic chat screen for consultation sessions
- `app/(tabs)/map.tsx` - Map view for finding nearby law offices
- `app/(tabs)/settings/` - Settings screens organized in a subfolder with nested Stack navigation
- `app/login.tsx` and `app/register.tsx` - Authentication screens
- `app/search.tsx` - Modal search screen

The app uses a **Drawer (sidebar) + Stack** navigation pattern with dynamic routes.

### State Management

**Context API** is used for global state:

- **AuthContext** (`contexts/AuthContext.tsx`): Manages authentication state using AsyncStorage
  - Persists login token with key `'userToken'`
  - Provides `isLoggedIn`, `login()`, `logout()` to all components
  - Initial state is `null` while loading, then `true`/`false`

- **ChatContext** (`contexts/ChatContext.tsx`): Manages consultation sessions
  - Stores array of chat sessions with messages
  - Provides `createChat()`, `updateChatTitle()`, `addMessage()` functions
  - Each chat session contains: id, title, lastUpdated, messages array

### API Integration

All API endpoints are centralized in `constants/api.ts`:

- **Base URL**: `http://ceprj.gachon.ac.kr:60003`
- **Endpoints**: Authentication, consultations (CONS), messages, law offices, notices, FAQs, subscriptions
- Use the `API` constant for all API calls (e.g., `API.LOGIN`, `API.CONS_CREATE`)

### Type System

All shared types are defined in `types/index.ts`:
- `MessageType` - Chat messages with optional attachments
- `ChatSession` - Consultation session data
- `UserProfile` - User account information
- `Announcement`, `FAQ`, `SubscriptionPlan` - Content types

When adding new data structures, define them here first.

### Styling & Theme

- **Colors**: Defined in `constants/Colors.ts` with light/dark mode support
- Primary colors: `darkNavy`, `darkBlue`, `inputBox`, `text`, `textSecondary`
- Use the `Colors` constant throughout the app for consistency

### Path Aliases

The app uses `@/*` path alias pointing to the project root (configured in `tsconfig.json`):
```typescript
import { useAuth } from '@/contexts/AuthContext';
import { API } from '@/constants/api';
```

## Key Features & Flow

### Authentication Flow
1. User lands on `app/index.tsx` (splash/redirect screen)
2. AuthContext checks for stored token in AsyncStorage
3. If logged in → redirect to `/(tabs)` (main app)
4. If not → show `login.tsx` or `register.tsx`

### Chat/Consultation Flow
1. User opens drawer (swipe or menu button)
2. Taps "새로운 상담 시작" to create new chat session
3. `ChatContext.createChat()` generates new session ID
4. Navigate to `/(tabs)/chat/[id]` with dynamic ID
5. Messages are stored in the session's `messages` array
6. Chat title updates automatically based on first message

### Component Organization

- `components/` - Top-level reusable components (ChatBubble, EmptyState, SettingsMenuItem)
- `components/ui/` - Low-level UI primitives (themed-text, themed-view, Logo, etc.)
- `utils/helpers.ts` - Utility functions (formatDate, formatFileSize, validation)

## Important Notes

- **Expo New Architecture** is enabled (`newArchEnabled: true` in app.json)
- **React Compiler** experiment is enabled
- **Typed Routes** are enabled for type-safe navigation
- **AsyncStorage** is used for local persistence (auth tokens, preferences)
- The app supports iOS, Android, and Web platforms

## Working with This Codebase

When adding new features:

1. **New screens**: Add files to `app/` directory following Expo Router conventions
2. **New API endpoints**: Add to `constants/api.ts`
3. **Shared types**: Define in `types/index.ts`
4. **Global state**: Consider if a new Context is needed or extend existing ones
5. **Reusable components**: Create in `components/` or `components/ui/`
6. **Utility functions**: Add to `utils/helpers.ts`

When working with navigation:
- Use `useRouter()` hook for programmatic navigation
- Dynamic routes use bracket notation: `[id].tsx`
- Modal presentation: Set `presentation: 'modal'` in Stack.Screen options
