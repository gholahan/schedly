# Schedly Frontend

Next.js App Router frontend for the AI-powered calendar assistant.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **State & Data Fetching**: Zustand v5, TanStack Query v5
- **Styling**: Tailwind CSS v4, Lucide React icons
- **Validation & Forms**: Zod, React Hook Form
- **Testing**: Vitest, React Testing Library, MSW v2

## Architecture

```
frontend/
├── app/                         # Next.js App Router pages & layouts
│   ├── (auth)/                  # Login and signup routes
│   ├── (dashboard)/             # Main app dashboard
│   └── c/[id]/                  # Chat conversation detail view
├── features/                    # Feature-based domain modules
│   ├── auth/                    # Authentication state and components
│   ├── chat/                    # Chat interface, markdown rendering, sidebar
│   ├── calendar/                # Calendar management views
│   └── conversations/           # Conversation queries and mutations
├── lib/                         # Shared utilities (axios, date-fns, etc.)
└── tests/                       # Vitest unit & integration test suite
```

## Running Locally

### Prerequisites
- Node.js 18+ / npm

### Setup
```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000

# 4. Run development server
npm run dev
```

App runs at `http://localhost:3000`.

## Testing Suite

Comprehensive unit and integration test suite built with **Vitest**, **React Testing Library**, and **MSW v2** (Mock Service Worker).

- **Test Score**: **36 / 36 tests passing** (100% success rate across components, hooks, stores, and API queries).
- [frontend/vitest.config.mts](vitest.config.mts): Vitest test environment configuration.

- **Reference Folder**:frontend/tests

### Test Architecture
- **Component Tests**: Render React components with providers (`QueryClient`, router mocks) using `renderWithProviders` ([frontend/tests/utils/render.tsx](tests/utils/render.tsx)).
- **API Mocking**: Network requests intercepted and mocked via MSW v2 handlers ([frontend/tests/mocks/handlers.ts](tests/mocks/handlers.ts)).
- **Factories**: Test data factories ([frontend/tests/mocks/factories.ts](tests/mocks/factories.ts)) for consistent mock users and conversation objects.

### Running Tests
```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```
