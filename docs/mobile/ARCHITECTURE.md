# Mobile Architecture

The mobile application is a Flutter client serving as a secondary interface to the existing AgroRent AI backend.

## Design Philosophy

- **Single Source of Truth**: The Supabase PostgreSQL database and Express backend are the ultimate sources of truth. The mobile app stores minimal state.
- **Role-Based Routing**: After authentication, Farmers and Owners are directed to entirely different features (Marketplace vs. Dashboard).
- **Riverpod State Management**: Used for providing repositories, handling API calls, and caching data locally.
- **Clean Architecture**: `core/`, `features/`, `models/`, `shared/` separation.

## Data Flow

1. User Action in UI -> Riverpod Notifier
2. Notifier calls Repository
3. Repository calls ApiClient
4. ApiClient securely injects the JWT Token and contacts the Node.js backend.
5. Node.js backend interacts with Prisma/Supabase and returns JSON.
6. Notifier updates state, UI rebuilds.
