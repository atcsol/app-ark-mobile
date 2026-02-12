r# ARK Garage - Mobile Authentication (React Native)

Complete authentication system built with React Native, Expo, TypeScript, and Ant Design Mobile.

## Features

### Login Screen
- Email and password authentication
- "Remember me" checkbox functionality
- Form validation with real-time feedback
- Loading states during authentication
- Comprehensive error handling
- Links to registration and password recovery
- Fully responsive design
- Keyboard-aware scrolling
- Safe area handling for all devices

### Register Screen
- Complete user registration (name, email, password)
- Real-time password strength indicator
- Password confirmation validation
- Terms and conditions acceptance
- Multi-criteria password validation (length, uppercase, lowercase, numbers, special characters)
- Visual feedback for all validation requirements
- Secure password input

### Forgot Password Screen
- Email-based password reset request
- Success state with clear instructions
- Resend functionality
- Helpful troubleshooting tips
- Clean, user-friendly interface

## Technology Stack

- **Framework**: React Native 0.76.5
- **Development**: Expo ~52.0.0
- **Router**: Expo Router ~4.0.0
- **UI Library**: Ant Design Mobile 5.2.1
- **Language**: TypeScript 5.5
- **HTTP Client**: Axios
- **Storage**: AsyncStorage
- **Safe Areas**: react-native-safe-area-context

## Project Structure

```
mobile-react-native/
├── app/
│   ├── auth/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   └── _layout.tsx
├── src/
│   ├── screens/
│   │   └── auth/
│   │       ├── LoginScreen.tsx
│   │       ├── RegisterScreen.tsx
│   │       └── ForgotPasswordScreen.tsx
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── auth.ts
│   └── utils/
│       └── validation.ts
├── package.json
├── tsconfig.json
├── app.json
└── .env.example
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your Laravel backend URL:
```
API_BASE_URL=http://your-api-url.com/api
```

**Note**: For iOS simulator, use `http://localhost:8000/api`
For Android emulator, use `http://10.0.2.2:8000/api`
For physical devices, use your computer's IP address

## Development

### Start the development server:
```bash
npm start
```

### Run on specific platform:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Available Routes

- `/auth/login` - Login screen
- `/auth/register` - Registration screen
- `/auth/forgot-password` - Password recovery screen

## API Integration

The application is ready to integrate with your Laravel backend. The API service expects the following endpoints:

### Login
```
POST /api/auth/login
Body: { email, password, remember }
Response: { success, message, data: { token, user } }
```

### Register
```
POST /api/auth/register
Body: { name, email, password, password_confirmation }
Response: { success, message, data: { token, user } }
```

### Forgot Password
```
POST /api/auth/forgot-password
Body: { email }
Response: { success, message }
```

### Logout
```
POST /api/auth/logout
Headers: { Authorization: Bearer <token> }
Response: { success, message }
```

## Authentication Token Management

The application automatically:
- Stores authentication tokens in `AsyncStorage`
- Adds tokens to all API requests via interceptors
- Handles 401 unauthorized responses
- Persists authentication state across app restarts

## Form Validation

All forms include comprehensive validation:

### Login
- Email format validation
- Password minimum length (6 characters)

### Register
- Name validation (letters and spaces only, minimum 2 characters)
- Email format validation
- Password strength validation (minimum 8 characters, must include uppercase, lowercase, numbers, and special characters)
- Password confirmation matching
- Terms and conditions acceptance

### Forgot Password
- Email format validation

## Password Strength Indicator

The registration screen includes a visual password strength indicator that checks:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

Strength levels:
- **Weak**: 0-2 criteria met (Red - #ff4d4f)
- **Medium**: 3-4 criteria met (Orange - #faad14)
- **Strong**: All 5 criteria met (Green - #52c41a)

## Styling

The application follows Ant Design principles:
- 8px grid system for consistent spacing
- Ant Design color palette
- Responsive design that adapts to all screen sizes
- Proper visual hierarchy and contrast
- Native-feeling interactions

## Platform-Specific Considerations

### iOS
- Safe area handling for notched devices
- Keyboard avoiding behavior optimized
- Native scrolling behavior

### Android
- Material Design animations
- Back button handling
- StatusBar styling

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## Testing on Device

### Using Expo Go
1. Install Expo Go on your device
2. Scan the QR code from `npm start`
3. The app will load on your device

### Using Development Build
```bash
# Create a development build
expo prebuild
expo run:ios  # or expo run:android
```

## Customization

### Theme
Modify the Ant Design Mobile provider in `app/_layout.tsx`:
```typescript
<Provider>
  {/* Your app content */}
</Provider>
```

### API Configuration
Update the base URL in `src/services/api.ts`.

### Navigation
Modify routes in the `app/` directory using Expo Router file-based routing.

## Best Practices

1. **Security**
   - Tokens stored in AsyncStorage (secure for mobile)
   - HTTPS required for production API
   - Implement certificate pinning for production

2. **Performance**
   - Components optimized for 60fps
   - Images and assets properly optimized
   - Lazy loading for heavy components
   - Memoization used where appropriate

3. **User Experience**
   - Keyboard handling for all inputs
   - Loading states prevent double submissions
   - Error messages are clear and actionable
   - Success feedback is immediate

4. **Accessibility**
   - All touchable elements have minimum 44x44pt hit area
   - Form inputs have proper labels
   - Error messages are descriptive
   - Color contrast meets WCAG standards

5. **Error Handling**
   - Network errors handled gracefully
   - Offline state detection recommended
   - Validation errors displayed inline
   - API errors shown in native alerts

## Platform Support

- iOS 13.0 and above
- Android 6.0 (API level 23) and above

## Troubleshooting

### Metro bundler issues
```bash
# Clear cache
expo start -c
```

### Module resolution errors
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### iOS build issues
```bash
cd ios
pod install
cd ..
```

### Android build issues
```bash
cd android
./gradlew clean
cd ..
```

## Network Configuration

### iOS (Info.plist)
For development with HTTP:
```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

### Android (AndroidManifest.xml)
For development with HTTP:
```xml
<application
  android:usesCleartextTraffic="true"
  ...
</application>
```

## Additional Features to Implement

Consider adding:
- Biometric authentication (Face ID / Touch ID / Fingerprint)
- Social authentication (Google, Apple, Facebook)
- Multi-factor authentication (2FA)
- Session management
- Offline mode
- Push notifications for password reset
- Deep linking for password reset emails

## License

Proprietary - ARK Garage
