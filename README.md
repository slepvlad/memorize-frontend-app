# Memorize App — Expo Project

## Setup Instructions

### 1. Copy files into your existing Expo project

Copy the contents of this folder into your existing Expo project at
`/Users/Revan/IdeaProjects/memorize/app/`:

```bash
# From this folder, copy everything over:
cp -r src/ /Users/Revan/IdeaProjects/memorize/app/src/
cp -r app/ /Users/Revan/IdeaProjects/memorize/app/app/
```

### 2. Install dependencies

```bash
cd /Users/Revan/IdeaProjects/memorize/app

npx expo install expo-secure-store expo-linear-gradient expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar @expo/vector-icons

npm install axios
```

### 3. Configure your backend URL

Open `src/api/client.ts` and change the `API_BASE_URL`:

```typescript
// For Android emulator (maps to host machine's localhost):
export const API_BASE_URL = 'http://10.0.2.2:8080';

// For iOS simulator (localhost works):
export const API_BASE_URL = 'http://localhost:8080';

// For physical device (use your machine's local IP):
export const API_BASE_URL = 'http://192.168.x.x:8080';
```

### 4. Run the app

```bash
npx expo start
```

Press `i` for iOS, `a` for Android, or `w` for web.

## Project Structure

```
app/                          # Expo Router screens
├── _layout.tsx               # Root: AuthProvider + auth routing
├── (auth)/                   # Auth flow (unauthenticated)
│   ├── _layout.tsx           # Stack navigator
│   ├── index.tsx             # Welcome screen
│   ├── login.tsx             # Login screen
│   └── register.tsx          # Register screen
└── (tabs)/                   # Main app (authenticated)
    ├── _layout.tsx           # Bottom tab navigator
    ├── index.tsx             # Home screen
    ├── learn.tsx             # Flashcard learning
    ├── quiz.tsx              # Multiple choice quiz
    └── progress.tsx          # Stats & progress

src/                          # Shared logic
├── api/
│   ├── client.ts             # Axios + JWT interceptor + token refresh
│   └── auth.ts               # Auth API (login, register, refresh, logout)
├── context/
│   └── AuthContext.tsx        # Auth state + provider
├── storage/
│   └── tokenStorage.ts       # Secure token persistence
├── theme/
│   └── index.ts              # Colors, spacing, typography
└── components/ui/
    ├── Button.tsx             # Primary/Secondary/Ghost button
    └── Input.tsx              # Text input with label, error, password toggle
```

## Auth Flow

1. App launches → `_layout.tsx` wraps everything in `AuthProvider`
2. `AuthProvider` checks SecureStore for existing tokens
3. If tokens exist, it tries `POST /api/auth/refresh` to validate
4. Based on auth state, Expo Router redirects:
   - Not authenticated → `(auth)/` screens (Welcome → Login/Register)
   - Authenticated → `(tabs)/` screens (Home, Learn, Quiz, Stats)
5. Login/Register calls the API, stores tokens in SecureStore
6. Axios interceptor automatically attaches Bearer token to all requests
7. On 401 response, interceptor tries token refresh automatically
8. If refresh fails, user is logged out and redirected to Welcome

## API Endpoints Used

| Endpoint              | Method | Purpose                 |
|-----------------------|--------|-------------------------|
| `/api/auth/register`  | POST   | Create account          |
| `/api/auth/login`     | POST   | Sign in                 |
| `/api/auth/refresh`   | POST   | Refresh expired token   |
