# Broodly Test Framework Specification

**Author:** Murat (TEA Agent)
**Date:** 2026-03-28
**Status:** Ready for Implementation
**Risk Threshold:** P1 (from TEA config)

---

## Executive Summary

This specification defines the complete test framework architecture for Broodly, covering three test domains: **frontend** (Expo/React Native), **backend** (Go API), and **cross-stack** (Playwright for API integration + web E2E). It is designed for phased rollout aligned with feature development, not upfront scaffolding of empty infrastructure.

**Key Decisions:**

| Domain | Framework | Rationale |
|--------|-----------|-----------|
| Frontend Unit/Component | Jest + @testing-library/react-native | Expo default, RN-compatible, architecture.md specifies Jest-compatible |
| Backend Unit/Integration | `go test` + testify + testcontainers-go | Architecture.md specifies this stack; Go stdlib testing is first-class |
| API Integration + Web E2E | Playwright + @seontechnologies/playwright-utils | Typed HTTP client, fixture composition, auth persistence, CI-ready |
| Contract Testing | Deferred (schema-first validation via gqlgen) | Single API service in MVP; Pact warranted only when services multiply |
| Native Mobile E2E | Deferred (Maestro or Detox) | Playwright cannot drive native iOS/Android; defer until 3+ screens exist |

---

## 1. Directory Structure

```
broodly/
├── apps/
│   ├── mobile/
│   │   ├── src/
│   │   │   ├── features/
│   │   │   │   └── inspection/
│   │   │   │       ├── components/
│   │   │   │       │   ├── InspectionForm.tsx
│   │   │   │       │   └── InspectionForm.test.tsx       # Co-located unit test
│   │   │   │       └── hooks/
│   │   │   │           ├── useInspection.ts
│   │   │   │           └── useInspection.test.ts         # Co-located unit test
│   │   │   └── services/
│   │   │       ├── graphql-client.ts
│   │   │       └── graphql-client.test.ts
│   │   ├── jest.config.ts                                # Frontend Jest config
│   │   └── jest.setup.ts                                 # Test setup (mocks, providers)
│   │
│   └── api/
│       ├── internal/
│       │   ├── domain/
│       │   │   ├── recommendation.go
│       │   │   └── recommendation_test.go                # Co-located Go test
│       │   ├── service/
│       │   │   ├── inspection_service.go
│       │   │   └── inspection_service_test.go
│       │   └── repository/
│       │       ├── hive_repository.go
│       │       └── hive_repository_test.go               # Integration test (testcontainers)
│       ├── graph/
│       │   └── resolver/
│       │       ├── inspection_resolver.go
│       │       └── inspection_resolver_test.go
│       └── go.mod
│
├── packages/
│   └── test-utils/                                       # Shared test utilities
│       ├── package.json
│       ├── src/
│       │   ├── index.ts
│       │   └── factories/
│       │       ├── user-factory.ts
│       │       ├── apiary-factory.ts
│       │       ├── hive-factory.ts
│       │       ├── inspection-factory.ts
│       │       └── recommendation-factory.ts
│       └── tsconfig.json
│
├── tests/                                                # Cross-stack tests
│   ├── playwright.config.ts                              # Playwright config
│   ├── playwright/
│   │   ├── config/
│   │   │   ├── base.config.ts
│   │   │   ├── local.config.ts
│   │   │   └── staging.config.ts
│   │   ├── support/
│   │   │   ├── global-setup.ts
│   │   │   ├── fixtures/
│   │   │   │   ├── merged-fixtures.ts                    # Composed fixture entry point
│   │   │   │   ├── auth-fixture.ts                       # Firebase auth provider
│   │   │   │   └── seed-fixture.ts                       # API data seeding
│   │   │   └── helpers/
│   │   │       ├── seed-helpers.ts                        # Pure functions for API seeding
│   │   │       └── auth-provider.ts                       # Custom auth provider (Firebase)
│   │   └── .auth/                                        # Persisted auth state (gitignored)
│   ├── api/                                              # API integration tests
│   │   ├── graphql/
│   │   │   ├── inspection-mutations.spec.ts
│   │   │   └── recommendation-queries.spec.ts
│   │   └── health.spec.ts
│   └── e2e/                                              # Web E2E tests (Expo web)
│       ├── inspection-flow.spec.ts
│       └── onboarding-flow.spec.ts
│
├── .env.example                                          # Required env vars for tests
├── .env.test                                             # Test-specific env (gitignored)
└── scripts/
    └── burn-in-changed.sh                                # Burn-in runner for CI
```

### Placement Rules

| Test Type | Location | Naming Convention |
|-----------|----------|-------------------|
| Frontend unit/component | Co-located next to source file | `ComponentName.test.tsx` |
| Frontend hook/util | Co-located next to source file | `hookName.test.ts` |
| Go unit | Co-located in same package | `file_test.go` |
| Go integration (DB) | Co-located, build-tagged | `file_integration_test.go` with `//go:build integration` |
| API integration (Playwright) | `tests/api/` | `feature-name.spec.ts` |
| Web E2E (Playwright) | `tests/e2e/` | `journey-name.spec.ts` |

---

## 2. Frontend Testing (Jest + React Native Testing Library)

### 2.1 Dependencies

```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0",
    "ts-jest": "^29.2.0",
    "@testing-library/react-native": "^12.4.0",
    "@testing-library/jest-native": "^5.4.0",
    "@faker-js/faker": "^9.0.0",
    "jest-expo": "~52.0.0"
  }
}
```

> **Note:** `jest-expo` is the Expo-maintained Jest preset that handles Metro bundler transforms, asset mocking, and platform-specific module resolution. Always use the version that matches your Expo SDK version.

### 2.2 Jest Configuration

```typescript
// apps/mobile/jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-expo',
  setupFilesAfterSetup: ['./jest.setup.ts'],
  testMatch: [
    '<rootDir>/src/**/*.test.{ts,tsx}',
    '<rootDir>/app/**/*.test.{ts,tsx}',
  ],
  moduleNameMapper: {
    // Map workspace packages
    '^@broodly/ui(.*)$': '<rootDir>/../../packages/ui/src$1',
    '^@broodly/test-utils(.*)$': '<rootDir>/../../packages/test-utils/src$1',
    '^@broodly/domain-types(.*)$': '<rootDir>/../../packages/domain-types/src$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',        // barrel exports
    '!src/**/*.stories.{ts,tsx}',
  ],
  coverageThresholds: {
    global: {
      branches: 60,
      functions: 60,
      lines: 70,
      statements: 70,
    },
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@gluestack-ui/.*|@gluestack-style/.*|nativewind|react-native-css-interop)',
  ],
};

export default config;
```

### 2.3 Jest Setup File

```typescript
// apps/mobile/jest.setup.ts
import '@testing-library/jest-native/extend-expect';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Link: 'Link',
}));

// Mock @react-native-async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Silence RN warnings in test output
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
```

### 2.4 Frontend Test Patterns

**Component Test (Gluestack compound components):**

```typescript
// src/features/inspection/components/HiveHealthCard.test.tsx
import { render, screen } from '@testing-library/react-native';
import { HiveHealthCard } from './HiveHealthCard';
import { createHive } from '@broodly/test-utils';

describe('HiveHealthCard', () => {
  it('renders healthy status with success badge', () => {
    const hive = createHive({ status: 'healthy', name: 'Hive 3' });

    render(<HiveHealthCard hive={hive} />);

    expect(screen.getByText('Hive 3')).toBeOnTheScreen();
    expect(screen.getByText('Healthy')).toBeOnTheScreen();
    // Status is NEVER color-only: must have icon + text + color
    expect(screen.getByLabelText(/healthy/i)).toBeOnTheScreen();
  });

  it('renders critical status with error badge and action', () => {
    const hive = createHive({
      status: 'critical',
      name: 'Hive 7',
      nextAction: 'Requeen immediately',
      nextActionDate: new Date('2026-04-01'),
    });

    render(<HiveHealthCard hive={hive} />);

    expect(screen.getByText('Critical')).toBeOnTheScreen();
    expect(screen.getByText('Requeen immediately')).toBeOnTheScreen();
  });

  it('announces hive name, status, and next action for screen readers', () => {
    const hive = createHive({
      status: 'warning',
      name: 'Hive 3',
      nextAction: 'Add super',
      nextActionDate: new Date('2026-04-05'),
    });

    render(<HiveHealthCard hive={hive} />);

    // WCAG: Health cards announce name + status + next action as single description
    expect(screen.getByRole('summary')).toHaveAccessibleName(
      expect.stringContaining('Hive 3'),
    );
  });
});
```

**Hook Test:**

```typescript
// src/features/inspection/hooks/useInspection.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useInspection } from './useInspection';
import { createInspection } from '@broodly/test-utils';

describe('useInspection', () => {
  it('initializes with empty frame observations', () => {
    const { result } = renderHook(() => useInspection('hive-123'));

    expect(result.current.frames).toEqual([]);
    expect(result.current.isComplete).toBe(false);
  });

  it('adds frame observation and updates completion state', () => {
    const { result } = renderHook(() => useInspection('hive-123'));

    act(() => {
      result.current.addFrame({
        position: 1,
        broodPattern: 'solid',
        queenSeen: true,
      });
    });

    expect(result.current.frames).toHaveLength(1);
    expect(result.current.frames[0].broodPattern).toBe('solid');
  });
});
```

**Pure Function Test:**

```typescript
// src/services/recommendation-scorer.test.ts
import { scoreRecommendation, ConfidenceLevel } from './recommendation-scorer';

describe('scoreRecommendation', () => {
  it('returns high confidence when multiple signals agree', () => {
    const result = scoreRecommendation({
      weatherFavorable: true,
      seasonallyAppropriate: true,
      hiveDataStrong: true,
      historicalSuccess: 0.85,
    });

    expect(result.confidence).toBe(ConfidenceLevel.HIGH);
    expect(result.score).toBeGreaterThan(0.8);
  });

  it('returns low confidence with insufficient data', () => {
    const result = scoreRecommendation({
      weatherFavorable: true,
      seasonallyAppropriate: true,
      hiveDataStrong: false,
      historicalSuccess: 0,
    });

    expect(result.confidence).toBe(ConfidenceLevel.LOW);
  });

  // Every recommendation MUST include: action + rationale + confidence + fallback
  it('always includes fallback action', () => {
    const result = scoreRecommendation({
      weatherFavorable: false,
      seasonallyAppropriate: false,
      hiveDataStrong: false,
      historicalSuccess: 0,
    });

    expect(result.fallback).toBeDefined();
    expect(result.fallback.action).toBeTruthy();
    expect(result.fallback.rationale).toBeTruthy();
  });
});
```

### 2.5 What to Test at This Level

| Test | Level | Why |
|------|-------|-----|
| Recommendation scoring logic | Unit | Complex branching, pure function, fast feedback |
| Health status derivation | Unit | Business logic, maps sensor data to 4-tier status |
| Gluestack component rendering | Component | Validates compound patterns, accessibility labels |
| Hook state transitions | Component | Inspection flow state machine |
| Zustand store logic | Unit | State management correctness |
| TanStack Query cache behavior | Integration (mock) | Cache-first read pattern, staleness escalation |

### 2.6 What NOT to Test at This Level

- GraphQL network requests (test at API integration level)
- Navigation between screens (test at E2E level)
- Visual layout/styling (visual regression at E2E level)
- Expo Router routing logic (framework behavior)
- Gluestack internal rendering (library responsibility)

---

## 3. Backend Testing (Go)

### 3.1 Dependencies

```go
// go.mod (test dependencies)
require (
    github.com/stretchr/testify v1.9.0
    github.com/testcontainers/testcontainers-go v0.33.0
    github.com/testcontainers/testcontainers-go/modules/postgres v0.33.0
)
```

### 3.2 Go Test Patterns

**Domain Logic (Unit):**

```go
// internal/domain/recommendation_test.go
package domain_test

import (
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "broodly/internal/domain"
)

func TestScoreRecommendation(t *testing.T) {
    t.Run("high confidence when signals agree", func(t *testing.T) {
        input := domain.RecommendationInput{
            WeatherFavorable:     true,
            SeasonallyAppropriate: true,
            HiveDataStrong:       true,
            HistoricalSuccess:    0.85,
        }

        result, err := domain.ScoreRecommendation(input)
        require.NoError(t, err)
        assert.Equal(t, domain.ConfidenceHigh, result.Confidence)
        assert.Greater(t, result.Score, 0.8)
    })

    t.Run("always includes fallback action", func(t *testing.T) {
        input := domain.RecommendationInput{} // minimal input

        result, err := domain.ScoreRecommendation(input)
        require.NoError(t, err)
        assert.NotEmpty(t, result.Fallback.Action)
        assert.NotEmpty(t, result.Fallback.Rationale)
    })
}
```

**Repository (Integration with testcontainers):**

```go
// internal/repository/hive_repository_test.go
//go:build integration

package repository_test

import (
    "context"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "github.com/testcontainers/testcontainers-go/modules/postgres"
    "broodly/internal/repository"
    "broodly/internal/testutil"
)

func TestHiveRepository_Create(t *testing.T) {
    ctx := context.Background()

    // Spin up real PostgreSQL with pgvector
    pgContainer, connStr := testutil.StartPostgres(t, ctx)
    defer pgContainer.Terminate(ctx)

    repo := repository.NewHiveRepository(connStr)

    t.Run("creates hive and returns ID", func(t *testing.T) {
        hive := testutil.CreateHive(t, testutil.HiveOverrides{
            Name: "Test Hive 1",
        })

        id, err := repo.Create(ctx, hive)
        require.NoError(t, err)
        assert.NotEmpty(t, id)

        // Verify persistence
        fetched, err := repo.GetByID(ctx, id)
        require.NoError(t, err)
        assert.Equal(t, "Test Hive 1", fetched.Name)
    })
}
```

**Test Helper for PostgreSQL Container:**

```go
// internal/testutil/postgres.go
//go:build integration

package testutil

import (
    "context"
    "testing"

    "github.com/testcontainers/testcontainers-go"
    "github.com/testcontainers/testcontainers-go/modules/postgres"
    "github.com/testcontainers/testcontainers-go/wait"
)

func StartPostgres(t *testing.T, ctx context.Context) (*postgres.PostgresContainer, string) {
    t.Helper()

    pgContainer, err := postgres.Run(ctx,
        "pgvector/pgvector:pg16",
        postgres.WithDatabase("broodly_test"),
        postgres.WithUsername("test"),
        postgres.WithPassword("test"),
        postgres.WithInitScripts("../../migrations/*.sql"), // Run migrations
        testcontainers.WithWaitStrategy(
            wait.ForLog("database system is ready to accept connections").
                WithOccurrence(2),
        ),
    )
    if err != nil {
        t.Fatalf("failed to start postgres: %v", err)
    }

    connStr, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
    if err != nil {
        t.Fatalf("failed to get connection string: %v", err)
    }

    return pgContainer, connStr
}
```

**Go Factory Functions:**

```go
// internal/testutil/factories.go
package testutil

import (
    "fmt"
    "math/rand"
    "testing"
    "time"

    "broodly/internal/domain"
)

type HiveOverrides struct {
    Name     string
    Status   domain.HiveStatus
    ApiaryID string
}

func CreateHive(t *testing.T, overrides ...HiveOverrides) domain.Hive {
    t.Helper()

    o := HiveOverrides{}
    if len(overrides) > 0 {
        o = overrides[0]
    }

    hive := domain.Hive{
        ID:        fmt.Sprintf("hive-%d", rand.Int63()),
        Name:      fmt.Sprintf("Test Hive %d", rand.Intn(1000)),
        Status:    domain.StatusHealthy,
        ApiaryID:  fmt.Sprintf("apiary-%d", rand.Int63()),
        CreatedAt: time.Now(),
    }

    if o.Name != "" {
        hive.Name = o.Name
    }
    if o.Status != "" {
        hive.Status = o.Status
    }
    if o.ApiaryID != "" {
        hive.ApiaryID = o.ApiaryID
    }

    return hive
}
```

### 3.3 Go Test Execution

```bash
# Unit tests only (fast, no external deps)
go test ./internal/domain/... ./internal/service/...

# Integration tests (requires Docker for testcontainers)
go test -tags=integration ./internal/repository/...

# All tests with race detector
go test -race ./...

# Verbose with coverage
go test -v -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html
```

### 3.4 GraphQL Resolver Testing

```go
// graph/resolver/inspection_resolver_test.go
package resolver_test

import (
    "context"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
    "broodly/graph/resolver"
    "broodly/internal/service/mocks"
)

func TestInspectionResolver_CreateInspection(t *testing.T) {
    mockService := mocks.NewInspectionService(t)

    mockService.On("Create", mock.Anything, mock.AnythingOfType("CreateInspectionInput")).
        Return(&domain.Inspection{ID: "insp-123"}, nil)

    r := resolver.NewResolver(mockService)

    result, err := r.Mutation().CreateInspection(context.Background(), model.CreateInspectionInput{
        HiveID: "hive-456",
    })

    assert.NoError(t, err)
    assert.Equal(t, "insp-123", result.ID)
    mockService.AssertExpectations(t)
}
```

---

## 4. API Integration & Web E2E Testing (Playwright)

### 4.1 Dependencies

```json
{
  "devDependencies": {
    "@playwright/test": "^1.54.0",
    "@seontechnologies/playwright-utils": "latest",
    "ajv": "^8.17.0",
    "dotenv": "^16.4.0",
    "@faker-js/faker": "^9.0.0"
  }
}
```

### 4.2 Playwright Configuration

```typescript
// tests/playwright.config.ts
import { config as dotenvConfig } from 'dotenv';
import path from 'path';

dotenvConfig({ path: path.resolve(__dirname, '../.env.test') });

const envConfigMap = {
  local: require('./playwright/config/local.config').default,
  staging: require('./playwright/config/staging.config').default,
};

const environment = process.env.TEST_ENV || 'local';

if (!Object.keys(envConfigMap).includes(environment)) {
  console.error(`No configuration for environment: ${environment}`);
  console.error(`Available: ${Object.keys(envConfigMap).join(', ')}`);
  process.exit(1);
}

console.log(`Running tests against: ${environment.toUpperCase()}`);
export default envConfigMap[environment as keyof typeof envConfigMap];
```

```typescript
// tests/playwright/config/base.config.ts
import { defineConfig } from '@playwright/test';
import path from 'path';

export const baseConfig = defineConfig({
  testDir: path.resolve(__dirname, '..'),
  outputDir: path.resolve(__dirname, '../../test-results'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['list'],
  ],
  use: {
    actionTimeout: 15000,
    navigationTimeout: 30000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  globalSetup: path.resolve(__dirname, '../support/global-setup.ts'),
  timeout: 60000,
  expect: { timeout: 10000 },
});
```

```typescript
// tests/playwright/config/local.config.ts
import { defineConfig } from '@playwright/test';
import { baseConfig } from './base.config';

export default defineConfig({
  ...baseConfig,
  use: {
    ...baseConfig.use,
    baseURL: 'http://localhost:8080', // Go API
  },
  projects: [
    {
      name: 'api',
      testMatch: /.*\/api\/.*\.spec\.ts/,
      // No browser needed for API tests
    },
    {
      name: 'web-e2e',
      testMatch: /.*\/e2e\/.*\.spec\.ts/,
      use: {
        baseURL: 'http://localhost:8081', // Expo web
        ...baseConfig.use,
      },
    },
  ],
});
```

### 4.3 Fixture Architecture

```typescript
// tests/playwright/support/fixtures/merged-fixtures.ts
import { mergeTests } from '@playwright/test';
import { test as apiRequestFixture } from '@seontechnologies/playwright-utils/api-request/fixtures';
import { test as authFixture } from './auth-fixture';
import { test as seedFixture } from './seed-fixture';
import { test as logFixture } from '@seontechnologies/playwright-utils/log/fixtures';

export const test = mergeTests(
  apiRequestFixture,
  authFixture,
  seedFixture,
  logFixture,
);

export { expect } from '@playwright/test';
```

```typescript
// tests/playwright/support/helpers/auth-provider.ts
// Custom auth provider for Firebase Authentication
import { type AuthProvider } from '@seontechnologies/playwright-utils/auth-session';

const firebaseAuthProvider: AuthProvider = {
  getEnvironment: (options) => options.environment || 'local',
  getUserIdentifier: (options) => options.userIdentifier || 'default-beekeeper',

  extractToken: (storageState) => {
    const entry = storageState.origins?.[0]?.localStorage?.find(
      (item) => item.name === 'firebase_id_token',
    );
    return entry?.value;
  },

  isTokenExpired: (storageState) => {
    const expiryEntry = storageState.origins?.[0]?.localStorage?.find(
      (item) => item.name === 'token_expiry',
    );
    if (!expiryEntry) return true;
    return Date.now() > parseInt(expiryEntry.value, 10);
  },

  manageAuthToken: async (request, options) => {
    // Use Firebase Auth REST API to get ID token
    // In local dev, use Firebase Emulator
    const apiKey = process.env.FIREBASE_API_KEY;
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!apiKey || !email || !password) {
      throw new Error(
        'FIREBASE_API_KEY, TEST_USER_EMAIL, and TEST_USER_PASSWORD must be set',
      );
    }

    const authUrl = process.env.FIREBASE_AUTH_EMULATOR_HOST
      ? `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`
      : `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

    const response = await request.post(authUrl, {
      data: { email, password, returnSecureToken: true },
    });

    if (!response.ok()) {
      throw new Error(`Firebase auth failed: ${response.status()}`);
    }

    const { idToken, expiresIn } = await response.json();
    const expiryTime = Date.now() + parseInt(expiresIn, 10) * 1000;

    return {
      cookies: [],
      origins: [
        {
          origin: process.env.API_BASE_URL || 'http://localhost:8080',
          localStorage: [
            { name: 'firebase_id_token', value: idToken },
            { name: 'token_expiry', value: String(expiryTime) },
          ],
        },
      ],
    };
  },
};

export default firebaseAuthProvider;
```

```typescript
// tests/playwright/support/fixtures/seed-fixture.ts
import { test as base } from '@playwright/test';
import { createUser, createApiary, createHive } from '@broodly/test-utils';

type SeedFixture = {
  seedUser: (overrides?: Partial<User>) => Promise<User>;
  seedApiary: (overrides?: Partial<Apiary>) => Promise<Apiary>;
  seedHive: (overrides?: Partial<Hive>) => Promise<Hive>;
};

export const test = base.extend<SeedFixture>({
  seedUser: async ({ request }, use) => {
    const createdIds: string[] = [];

    const seedUser = async (overrides = {}) => {
      const user = createUser(overrides);
      const response = await request.post('/api/v1/users', { data: user });
      if (!response.ok()) {
        throw new Error(`Failed to seed user: ${response.status()}`);
      }
      const created = await response.json();
      createdIds.push(created.id);
      return created;
    };

    await use(seedUser);

    // Auto-cleanup
    for (const id of createdIds) {
      await request.delete(`/api/v1/users/${id}`).catch(() => {});
    }
  },

  seedApiary: async ({ request }, use) => {
    const createdIds: string[] = [];

    const seedApiary = async (overrides = {}) => {
      const apiary = createApiary(overrides);
      const response = await request.post('/api/v1/apiaries', { data: apiary });
      if (!response.ok()) {
        throw new Error(`Failed to seed apiary: ${response.status()}`);
      }
      const created = await response.json();
      createdIds.push(created.id);
      return created;
    };

    await use(seedApiary);

    for (const id of createdIds) {
      await request.delete(`/api/v1/apiaries/${id}`).catch(() => {});
    }
  },

  seedHive: async ({ request }, use) => {
    const createdIds: string[] = [];

    const seedHive = async (overrides = {}) => {
      const hive = createHive(overrides);
      const response = await request.post('/api/v1/hives', { data: hive });
      if (!response.ok()) {
        throw new Error(`Failed to seed hive: ${response.status()}`);
      }
      const created = await response.json();
      createdIds.push(created.id);
      return created;
    };

    await use(seedHive);

    for (const id of createdIds) {
      await request.delete(`/api/v1/hives/${id}`).catch(() => {});
    }
  },
});
```

### 4.4 API Integration Test Pattern

```typescript
// tests/api/graphql/inspection-mutations.spec.ts
import { test, expect } from '../../playwright/support/fixtures/merged-fixtures';

test.describe('Inspection Mutations', () => {
  test('creates inspection with valid hive', async ({
    apiRequest,
    authToken,
    seedApiary,
    seedHive,
    log,
  }) => {
    await log.step('Seed test data');
    const apiary = await seedApiary({ name: 'Test Apiary' });
    const hive = await seedHive({ apiaryId: apiary.id, name: 'Hive 1' });

    await log.step('Create inspection via GraphQL');
    const { status, body } = await apiRequest({
      method: 'POST',
      path: '/graphql',
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        query: `
          mutation CreateInspection($input: CreateInspectionInput!) {
            createInspection(input: $input) {
              id
              hiveId
              status
              recommendation {
                action
                rationale
                confidence
                fallback { action rationale }
              }
            }
          }
        `,
        variables: {
          input: {
            hiveId: hive.id,
            frames: [
              { position: 1, broodPattern: 'SOLID', queenSeen: true },
            ],
          },
        },
      },
    });

    expect(status).toBe(200);
    expect(body.data.createInspection.id).toBeDefined();
    expect(body.data.createInspection.hiveId).toBe(hive.id);

    // Recommendation contract: action + rationale + confidence + fallback
    const rec = body.data.createInspection.recommendation;
    expect(rec.action).toBeTruthy();
    expect(rec.rationale).toBeTruthy();
    expect(rec.confidence).toBeTruthy();
    expect(rec.fallback).toBeDefined();
    expect(rec.fallback.action).toBeTruthy();
  });

  test('rejects inspection for non-existent hive', async ({
    apiRequest,
    authToken,
  }) => {
    const { status, body } = await apiRequest({
      method: 'POST',
      path: '/graphql',
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        query: `
          mutation CreateInspection($input: CreateInspectionInput!) {
            createInspection(input: $input) { id }
          }
        `,
        variables: {
          input: { hiveId: 'non-existent-hive', frames: [] },
        },
      },
    });

    expect(status).toBe(200); // GraphQL returns 200 with errors
    expect(body.errors).toBeDefined();
    expect(body.errors[0].message).toContain('not found');
  });
});
```

### 4.5 Web E2E Test Pattern

```typescript
// tests/e2e/inspection-flow.spec.ts
import { test, expect } from '../../playwright/support/fixtures/merged-fixtures';

test.describe('Inspection Flow', () => {
  test('beekeeper completes guided inspection', async ({
    page,
    seedApiary,
    seedHive,
    authToken,
    log,
  }) => {
    await log.step('Setup: seed apiary with hive');
    const apiary = await seedApiary({ name: 'Backyard Apiary' });
    const hive = await seedHive({
      apiaryId: apiary.id,
      name: 'Hive 1',
      status: 'healthy',
    });

    // Network-first: intercept BEFORE navigation
    const inspectionPromise = page.waitForResponse('**/graphql');

    await log.step('Navigate to hive and start inspection');
    await page.goto(`/apiaries/${apiary.id}/hives/${hive.id}`);
    await expect(page.getByText('Hive 1')).toBeVisible();

    // Primary CTA: 48px minimum touch target (gloved field use)
    const startButton = page.getByRole('button', { name: /start inspection/i });
    await expect(startButton).toBeVisible();
    await startButton.click();

    await log.step('Record frame observation');
    // One decision at a time during inspection
    await expect(page.getByText(/frame 1/i)).toBeVisible();
    await page.getByRole('button', { name: /solid brood/i }).click();
    await page.getByRole('switch', { name: /queen seen/i }).click();
    await page.getByRole('button', { name: /next frame/i }).click();

    await log.step('Complete inspection and view recommendation');
    await page.getByRole('button', { name: /finish inspection/i }).click();
    await inspectionPromise;

    // Recommendation card: action + rationale + confidence + fallback
    await expect(page.getByRole('heading', { level: 3 })).toBeVisible(); // action
    await expect(page.getByText(/because/i)).toBeVisible(); // rationale
    await expect(page.getByRole('progressbar')).toBeVisible(); // confidence

    // Tone check: calm, supportive, recovery-oriented
    const pageText = await page.textContent('body');
    expect(pageText).not.toMatch(/you failed|you missed|error occurred/i);
  });
});
```

---

## 5. Shared Test Factories (packages/test-utils)

### 5.1 Package Configuration

```json
// packages/test-utils/package.json
{
  "name": "@broodly/test-utils",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@faker-js/faker": "^9.0.0"
  }
}
```

### 5.2 Domain Factories

```typescript
// packages/test-utils/src/factories/user-factory.ts
import { faker } from '@faker-js/faker';

export type User = {
  id: string;
  email: string;
  displayName: string;
  role: 'owner' | 'collaborator' | 'support';
  skillTier: 'newbie' | 'amateur' | 'sideliner';
  createdAt: Date;
  isActive: boolean;
};

export const createUser = (overrides: Partial<User> = {}): User => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  displayName: faker.person.fullName(),
  role: 'owner',
  skillTier: 'amateur',
  createdAt: new Date(),
  isActive: true,
  ...overrides,
});
```

```typescript
// packages/test-utils/src/factories/apiary-factory.ts
import { faker } from '@faker-js/faker';
import { createUser, User } from './user-factory';

export type Apiary = {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  ownerId: string;
  hiveCount: number;
  status: 'healthy' | 'attention' | 'warning' | 'critical';
  createdAt: Date;
};

export const createApiary = (overrides: Partial<Apiary> = {}): Apiary => ({
  id: faker.string.uuid(),
  name: faker.location.city() + ' Apiary',
  location: {
    lat: faker.location.latitude(),
    lng: faker.location.longitude(),
  },
  ownerId: overrides.ownerId || faker.string.uuid(),
  hiveCount: faker.number.int({ min: 1, max: 20 }),
  status: 'healthy',
  createdAt: new Date(),
  ...overrides,
});
```

```typescript
// packages/test-utils/src/factories/hive-factory.ts
import { faker } from '@faker-js/faker';

export type Hive = {
  id: string;
  name: string;
  apiaryId: string;
  status: 'healthy' | 'attention' | 'warning' | 'critical';
  nextAction: string | null;
  nextActionDate: Date | null;
  lastInspectionDate: Date | null;
  createdAt: Date;
};

export const createHive = (overrides: Partial<Hive> = {}): Hive => ({
  id: faker.string.uuid(),
  name: `Hive ${faker.number.int({ min: 1, max: 50 })}`,
  apiaryId: overrides.apiaryId || faker.string.uuid(),
  status: 'healthy',
  nextAction: null,
  nextActionDate: null,
  lastInspectionDate: faker.date.recent({ days: 14 }),
  createdAt: new Date(),
  ...overrides,
});
```

```typescript
// packages/test-utils/src/factories/inspection-factory.ts
import { faker } from '@faker-js/faker';

export type FrameObservation = {
  position: number;
  broodPattern: 'solid' | 'spotty' | 'empty' | 'drone_heavy';
  queenSeen: boolean;
  honeyStores: 'full' | 'adequate' | 'low' | 'empty';
  notes: string;
};

export type Inspection = {
  id: string;
  hiveId: string;
  frames: FrameObservation[];
  weatherTemp: number;
  weatherCondition: string;
  startedAt: Date;
  completedAt: Date | null;
};

export const createFrameObservation = (
  overrides: Partial<FrameObservation> = {},
): FrameObservation => ({
  position: faker.number.int({ min: 1, max: 10 }),
  broodPattern: 'solid',
  queenSeen: faker.datatype.boolean(),
  honeyStores: 'adequate',
  notes: '',
  ...overrides,
});

export const createInspection = (
  overrides: Partial<Inspection> = {},
): Inspection => ({
  id: faker.string.uuid(),
  hiveId: overrides.hiveId || faker.string.uuid(),
  frames: overrides.frames || [
    createFrameObservation({ position: 1 }),
    createFrameObservation({ position: 2 }),
  ],
  weatherTemp: faker.number.int({ min: 10, max: 35 }),
  weatherCondition: faker.helpers.arrayElement(['sunny', 'cloudy', 'overcast']),
  startedAt: new Date(),
  completedAt: null,
  ...overrides,
});
```

```typescript
// packages/test-utils/src/factories/recommendation-factory.ts
import { faker } from '@faker-js/faker';

export type Recommendation = {
  id: string;
  action: string;
  rationale: string;
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number;
  fallback: {
    action: string;
    rationale: string;
  };
  inspectionId: string;
};

export const createRecommendation = (
  overrides: Partial<Recommendation> = {},
): Recommendation => ({
  id: faker.string.uuid(),
  action: faker.helpers.arrayElement([
    'Add honey super',
    'Check for queen cells',
    'Treat for varroa',
    'Combine weak colonies',
    'Feed sugar syrup',
  ]),
  rationale: faker.lorem.sentence(),
  confidence: 'medium',
  confidenceScore: faker.number.float({ min: 0.3, max: 0.95, fractionDigits: 2 }),
  fallback: {
    action: 'Continue monitoring — inspect again in 7 days',
    rationale: 'Insufficient data for a strong recommendation',
  },
  inspectionId: overrides.inspectionId || faker.string.uuid(),
  ...overrides,
});
```

```typescript
// packages/test-utils/src/index.ts
export * from './factories/user-factory';
export * from './factories/apiary-factory';
export * from './factories/hive-factory';
export * from './factories/inspection-factory';
export * from './factories/recommendation-factory';
```

---

## 6. CI/CD Pipeline

### 6.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests
on:
  pull_request:
  push:
    branches: [main]

env:
  GO_VERSION: '1.24'
  NODE_VERSION: '22'

jobs:
  # ──────────────────────────────────────
  # Go Backend Tests
  # ──────────────────────────────────────
  go-unit:
    name: Go Unit Tests
    runs-on: ubuntu-latest
    timeout-minutes: 10
    defaults:
      run:
        working-directory: apps/api
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
          cache-dependency-path: apps/api/go.sum

      - name: Run unit tests
        run: go test -race -coverprofile=coverage.out ./internal/domain/... ./internal/service/... ./graph/resolver/...

      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: go-coverage
          path: apps/api/coverage.out

  go-integration:
    name: Go Integration Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15
    defaults:
      run:
        working-directory: apps/api
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
          cache-dependency-path: apps/api/go.sum

      - name: Run integration tests (testcontainers)
        run: go test -race -tags=integration ./internal/repository/...

  # ──────────────────────────────────────
  # Frontend Tests
  # ──────────────────────────────────────
  frontend-unit:
    name: Frontend Unit & Component Tests
    runs-on: ubuntu-latest
    timeout-minutes: 10
    defaults:
      run:
        working-directory: apps/mobile
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit

      - name: Run Jest tests
        run: npx jest --ci --coverage --maxWorkers=2

      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: frontend-coverage
          path: apps/mobile/coverage/

  # ──────────────────────────────────────
  # Playwright API + E2E Tests
  # ──────────────────────────────────────
  playwright:
    name: Playwright Tests
    needs: [go-unit, frontend-unit]  # Run after unit tests pass
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
          cache-dependency-path: apps/api/go.sum

      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Start API server
        run: |
          cd apps/api && go run ./cmd/server &
          npx wait-on http://localhost:8080/healthz --timeout 30000
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}

      - name: Start Expo web
        run: |
          cd apps/mobile && npx expo start --web --no-dev &
          npx wait-on http://localhost:8081 --timeout 60000

      - name: Run Playwright tests
        run: npx playwright test --config=tests/playwright.config.ts
        env:
          TEST_ENV: local
          FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-results
          path: |
            test-results/
            playwright-report/
          retention-days: 30

  # ──────────────────────────────────────
  # Burn-in Changed Tests
  # ──────────────────────────────────────
  burn-in:
    name: Burn-In Changed Tests
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Detect changed test files
        id: changed
        run: |
          CHANGED=$(git diff --name-only origin/main...HEAD | grep -E '\.(spec|test)\.(ts|tsx|js|jsx)$' || echo "")
          echo "specs=$CHANGED" >> $GITHUB_OUTPUT

      - name: Run burn-in (5 iterations)
        if: steps.changed.outputs.specs != ''
        run: bash scripts/burn-in-changed.sh 5
```

### 6.2 npm Scripts

```json
{
  "scripts": {
    "test": "npm run test:frontend && npm run test:api",
    "test:frontend": "cd apps/mobile && npx jest",
    "test:frontend:watch": "cd apps/mobile && npx jest --watch",
    "test:frontend:coverage": "cd apps/mobile && npx jest --coverage",
    "test:api:unit": "cd apps/api && go test ./internal/domain/... ./internal/service/...",
    "test:api:integration": "cd apps/api && go test -tags=integration ./internal/repository/...",
    "test:api:all": "cd apps/api && go test -race ./...",
    "test:playwright": "npx playwright test --config=tests/playwright.config.ts",
    "test:playwright:api": "npx playwright test --config=tests/playwright.config.ts --project=api",
    "test:playwright:e2e": "npx playwright test --config=tests/playwright.config.ts --project=web-e2e",
    "test:playwright:ui": "npx playwright test --config=tests/playwright.config.ts --ui",
    "test:burn-in": "bash scripts/burn-in-changed.sh"
  }
}
```

---

## 7. Environment Configuration

### 7.1 Required Environment Variables

```bash
# .env.example

# Test environment (local | staging)
TEST_ENV=local

# Go API
API_BASE_URL=http://localhost:8080
DATABASE_URL=postgresql://broodly:broodly@localhost:5432/broodly_test?sslmode=disable

# Firebase Auth (for Playwright auth fixture)
FIREBASE_API_KEY=your_api_key
FIREBASE_PROJECT_ID=broodly-dev
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099

# Test credentials (seeded in Firebase Emulator)
TEST_USER_EMAIL=test-beekeeper@broodly.dev
TEST_USER_PASSWORD=test-password-123

# Expo web
EXPO_WEB_URL=http://localhost:8081
```

### 7.2 .gitignore Additions

```
# Test artifacts
test-results/
playwright-report/
playwright/.auth/
coverage/
*.out
burn-in-failures/
burn-in-log-*.txt

# Test environment
.env.test
```

---

## 8. Phased Rollout Plan

### Phase 1: With First Feature Story

**Implement when:** First implementation story begins (likely Expo init + first screen).

| Task | Domain | Priority |
|------|--------|----------|
| Create `packages/test-utils/` with domain factories | Shared | P0 |
| Configure Jest in `apps/mobile/` | Frontend | P0 |
| Write first component test for initial screen | Frontend | P0 |
| Configure Go test structure in `apps/api/` | Backend | P0 |
| Write first domain logic unit test | Backend | P0 |
| Add `test:frontend` and `test:api:unit` to CI workflow | CI | P0 |
| Create `.env.example` | Config | P1 |

### Phase 2: After API + Auth Story Ships

**Implement when:** GraphQL API is serving queries and Firebase auth is integrated.

| Task | Domain | Priority |
|------|--------|----------|
| Install Playwright + playwright-utils | Cross-stack | P0 |
| Create Playwright config with environment map | Cross-stack | P0 |
| Create Firebase auth provider fixture | Cross-stack | P0 |
| Create seed fixtures with auto-cleanup | Cross-stack | P0 |
| Write first GraphQL mutation integration test | Cross-stack | P0 |
| Add `go test -tags=integration` to CI | Backend | P1 |
| Add Playwright job to CI workflow | CI | P1 |

### Phase 3: After 3+ Screens Ship

**Implement when:** Multiple screens are navigable on Expo web.

| Task | Domain | Priority |
|------|--------|----------|
| Write first web E2E test (inspection flow) | E2E | P1 |
| Add burn-in script and CI job | CI | P1 |
| Evaluate Maestro for native mobile E2E | Mobile E2E | P2 |
| Add coverage thresholds to CI quality gate | CI | P2 |
| Consider sharding if test count > 50 | CI | P2 |

### Phase 4: Pre-Release Hardening

**Implement when:** Preparing for first public release.

| Task | Domain | Priority |
|------|--------|----------|
| Add visual regression tests for design system components | E2E | P2 |
| Add NFR tests (load time < 2s, recommendation < 2s) | E2E | P1 |
| Add accessibility audit tests (WCAG 2.1 AA) | E2E | P1 |
| Evaluate Pact for contract testing (if services multiply) | Contract | P3 |
| CI sharding across 4 machines | CI | P2 |

---

## 9. Quality Gates

### CI Must-Pass Criteria

| Gate | Condition | Blocks Merge? |
|------|-----------|---------------|
| Go unit tests | All pass, no race conditions | Yes |
| Go integration tests | All pass (testcontainers) | Yes |
| Frontend Jest tests | All pass | Yes |
| Playwright API tests | All pass | Yes |
| Playwright E2E tests | All pass (2 retries in CI) | Yes |
| Burn-in (changed tests) | 5/5 iterations pass | Yes |
| Go lint | `golangci-lint` clean | Yes |
| TypeScript lint + type-check | ESLint + tsc clean | Yes |
| Coverage (frontend) | > 60% branches, > 70% lines | No (advisory in Phase 1, blocking in Phase 4) |

### Test Quality Checklist (Per-Test)

Every test must satisfy before merge:

- [ ] No hard waits (`waitForTimeout`) — use event-based waits
- [ ] No conditional flow control (`if/else`, `try/catch` for flow)
- [ ] Under 300 lines
- [ ] Under 1.5 minutes execution time
- [ ] Self-cleaning (fixture teardown or explicit cleanup)
- [ ] Assertions visible in test body (not hidden in helpers)
- [ ] Unique data via factories (no hardcoded IDs/emails)
- [ ] Parallel-safe (no shared mutable state)

---

## 10. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Expo web diverges from native rendering | Medium | High | E2E tests cover web; add Maestro for native in Phase 3 |
| Firebase Emulator flakiness in CI | Low | Medium | Pin emulator version, add retry in CI setup |
| testcontainers slow in CI (Docker overhead) | Medium | Medium | Run integration tests in parallel job; cache Docker layers |
| GraphQL schema drift between Go types and TS factories | Medium | High | Generate TS types from schema (graphql-codegen); factories import generated types |
| Playwright browser install fails in CI | Low | High | Cache browser binaries; pin Playwright version |
| Factory data gets stale as domain evolves | Medium | Medium | Factories import domain types directly; TypeScript catches drift at compile time |

---

## Appendix A: Key Broodly Domain Constraints for Testing

These domain rules must be validated in tests:

1. **Recommendation contract:** Every recommendation MUST include `action + rationale + confidence + fallback`
2. **Status semantics:** Four levels only: `healthy | attention | warning | critical`
3. **Status accessibility:** Status is NEVER color-only; always icon + text + color
4. **Touch targets:** All interactive elements >= 48x48px; primary inspection actions >= 56x48px
5. **Minimum text:** Body text >= 16px (`size="md"`); no text smaller than 12px
6. **Tone:** Calm, supportive, recovery-oriented. Never punitive ("Nice work" not "Task complete")
7. **Offline:** Cache-first reads; mutations require connectivity; offline banner uses `info` action
8. **Staleness:** <24h subtle badge, 24-72h amber warning, >72h red banner with conservative defaults

## Appendix B: Deferred Decisions

| Decision | Defer Until | Options |
|----------|-------------|---------|
| Native mobile E2E framework | Phase 3 (3+ screens) | Maestro (simpler) vs Detox (more control) |
| Contract testing framework | Services multiply beyond single API | Pact.js (mature) vs schema validation (lighter) |
| Visual regression tool | Phase 4 (pre-release) | Playwright screenshots vs Percy/Chromatic |
| Performance testing | Phase 4 (NFR validation) | k6 (API load) vs Lighthouse CI (web perf) |
| Test data management | Scale requires it | Ephemeral databases vs fixture seeding vs snapshot restore |
