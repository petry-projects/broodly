# Story 1.3: Configure Gluestack UI v3 and NativeWind in Expo

Status: ready-for-dev

## Story

As a developer,
I want Gluestack UI v3 with NativeWind configured and a smoke-test component rendering,
so that all UI work uses the shared design system from the start.

## Acceptance Criteria (BDD)

1. GIVEN the `apps/mobile/` app WHEN I install Gluestack UI v3 THEN the GluestackUIProvider wraps the app root and renders without errors on iOS, Android, and web.
2. GIVEN the NativeWind configuration WHEN I use the class `bg-primary-500` in a component THEN it resolves to the Broodly primary color token `#D4880F`.
3. GIVEN the Tailwind config WHEN I inspect the spacing scale THEN it uses an 8px base system (8, 16, 24, 32, 40, 48, 56).
4. GIVEN all nine Broodly color categories WHEN I inspect the NativeWind/Tailwind config THEN primary, secondary, success, warning, error, info, typography, background, and outline tokens are defined with their full shade scales (0, 50, 100-900, 950).
5. GIVEN the smoke test screen WHEN it renders THEN it displays a Gluestack `<Button action="primary" variant="solid">` with `<ButtonText>` child and a `<Text>` component styled with NativeWind classes.
6. GIVEN the smoke test component WHEN tested with React Native Testing Library THEN the Button renders with ButtonText content and the component tree matches expectations.

## Tasks / Subtasks

- [ ] Install Gluestack UI v3 and NativeWind (AC: #1)
  - [ ] Run `npx gluestack-ui init` in `apps/mobile/` to initialize Gluestack v3
  - [ ] Install NativeWind: `pnpm --filter mobile add nativewind` and `pnpm --filter mobile add -D tailwindcss@3.3.2`
  - [ ] Install `react-native-reanimated` and `react-native-safe-area-context` if not already present
  - [ ] Configure `babel.config.js` with NativeWind preset: `plugins: ['nativewind/babel']`
  - [ ] Configure `metro.config.js` with NativeWind CSS support via `withNativeWind`
  - [ ] Wrap app root (`apps/mobile/app/_layout.tsx`) with `<GluestackUIProvider>`
  - [ ] Verify app boots on all platforms without errors
- [ ] Configure Tailwind with Broodly design tokens (AC: #2, #3, #4)
  - [ ] Create/update `apps/mobile/tailwind.config.ts` (or `.js`)
  - [ ] Set `content` paths to include all component files: `["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"]`
  - [ ] Extend `theme.colors` with all nine Broodly color scales:
    - `primary`: shades 0-950, key 500 = `#D4880F` (Honey Amber)
    - `secondary`: shades 0-950, key 500 = `#E8B931` (Pollen Gold)
    - `success`: shades 0-950, key 500 = `#2D7A3A` (Leaf Green)
    - `warning`: shades 0-950, key 500 = `#B8720A` (Dark Amber)
    - `error`: shades 0-950, key 500 = `#A63D2F` (Deep Rust Red)
    - `info`: shades 0-950, key 500 = `#4A90C4` (Sky Blue)
    - `typography`: shades 0-950, key 500 = `#6B7280`, key 800 = `#2C2C2C`
    - `background`: shades 0-950, key 0 = `#FFFFFF`, key 50 = `#FDF6E8`, key 100 = `#FAFAF7`
    - `outline`: shades 0-950, key 200 = `#E5E7EB`, key 300 = border active
  - [ ] Add semantic background tokens: `background-error` (#FEE2E2), `background-warning` (#FFF3E0), `background-success` (#E8F5E9), `background-info` (#E3F2FD), `background-muted` (#F3F4F6)
  - [ ] Extend `theme.spacing` with 8px base: `{ '1': '8px', '2': '16px', '3': '24px', '4': '32px', '5': '40px', '6': '48px', '7': '56px' }` (plus retain default Tailwind scale)
  - [ ] Set minimum touch target utilities if needed (48px, 56px)
- [ ] Configure Gluestack UI v3 theme provider with Broodly tokens (AC: #1, #4)
  - [ ] Create `apps/mobile/config.ts` (Gluestack config file) mapping Broodly color tokens as RGB triplets via `vars()`
  - [ ] Ensure `GluestackUIProvider` receives the config with `mode="light"` (dark mode deferred)
  - [ ] Verify Gluestack components inherit the token system (e.g., `action="primary"` maps to `primary-500`)
- [ ] Install initial Gluestack components (AC: #5)
  - [ ] Run `npx gluestack-ui add button` to add Button component
  - [ ] Run `npx gluestack-ui add text` to add Text component (if not auto-included)
  - [ ] Verify components are installed in `apps/mobile/components/ui/`
  - [ ] Verify compound pattern works: `<Button><ButtonText>Label</ButtonText></Button>`
- [ ] Create smoke test screen (AC: #5)
  - [ ] Create or update `apps/mobile/app/index.tsx` with a smoke test UI
  - [ ] Render: `<Button action="primary" variant="solid" size="xl"><ButtonText>Get Started</ButtonText></Button>`
  - [ ] Render: `<Text size="md" className="text-typography-800">Broodly Design System Smoke Test</Text>`
  - [ ] Render: `<Heading size="2xl">Welcome to Broodly</Heading>`
  - [ ] Render color token samples: boxes with `bg-primary-500`, `bg-success-500`, `bg-warning-500`, `bg-error-500`, `bg-info-500`
  - [ ] Verify visual rendering on iOS simulator, Android emulator, and web browser
- [ ] Write tests (AC: #6)
  - [ ] Create `apps/mobile/app/__tests__/smoke-test.test.tsx`
  - [ ] Test: Render the smoke test screen, assert `<ButtonText>` with "Get Started" text is present
  - [ ] Test: Render `<Button action="primary">`, assert it renders without throwing
  - [ ] Test: Verify NativeWind class `bg-primary-500` resolves correctly (snapshot or style assertion)
  - [ ] Test: Render `<Text size="md">` with NativeWind class, assert no errors

## Dev Notes

### Architecture Compliance
- Gluestack UI v3 is the MANDATORY component foundation per CLAUDE.md
- NativeWind provides Tailwind CSS utilities that compile to React Native StyleSheet
- All Gluestack components use compound pattern (e.g., `<Button><ButtonText>...</ButtonText></Button>`)
- Styling uses `tva()` (Tailwind Variant Authority) with `data-*` attribute state styling
- Color tokens use the format `--color-{category}-{shade}` stored as RGB triplets
- The `packages/ui/` shared library will build on top of these Gluestack primitives (future stories)
- System fonts only — no custom font installation (San Francisco on iOS, Roboto on Android)

### TDD Requirements (Tests First!)
- Test 1: **Button render test** — Render `<Button action="primary" variant="solid"><ButtonText>Test</ButtonText></Button>` wrapped in `<GluestackUIProvider>`. Assert `ButtonText` with content "Test" is in the tree. Use `@testing-library/react-native`.
- Test 2: **NativeWind token resolution test** — Render a `<View className="bg-primary-500" />` and verify the resolved background color matches the primary-500 token value. This may require snapshot testing or style extraction.
- Test 3: **Provider wrapping test** — Render the app root layout and assert `GluestackUIProvider` is present in the component tree.
- Test 4: **Text component test** — Render `<Text size="md" className="text-typography-800">Hello</Text>` and assert it renders the text content without errors.
- Test 5: **Heading component test** — Render `<Heading size="2xl">Title</Heading>` and assert it renders correctly.

### Technical Specifications
- **Gluestack UI:** v3 (latest via `npx gluestack-ui init`)
- **NativeWind:** latest compatible with Expo SDK 55
- **Tailwind CSS:** 3.3.2 (dev dependency, used by NativeWind at build time)
- **react-native-reanimated:** required by Gluestack animations
- **react-native-safe-area-context:** required by Gluestack layout
- **Testing library:** `@testing-library/react-native` with `jest-expo` preset
- **Gluestack component install:** `npx gluestack-ui add <component>` — installs into `components/ui/`
- **Color token format:** RGB triplets in `config.ts` via NativeWind `vars()` function
- **Variant system:** `tva()` for Tailwind Variant Authority definitions
- **Parent-child inheritance:** `withStyleContext()` / `useStyleContext()` for compound components

### Color Token Reference (exact values from CLAUDE.md)

| Category | 500 Value | Tailwind Class |
|---|---|---|
| `primary` | `#D4880F` | `bg-primary-500`, `text-primary-600` |
| `secondary` | `#E8B931` | `bg-secondary-500` |
| `success` | `#2D7A3A` | `bg-success-500` |
| `warning` | `#B8720A` | `bg-warning-500` |
| `error` | `#A63D2F` | `bg-error-500` |
| `info` | `#4A90C4` | `bg-info-500` |
| `typography` | `#6B7280` (500), `#2C2C2C` (800) | `text-typography-800` |
| `background` | `#FDF6E8` (50), `#FAFAF7` (100) | `bg-background-50` |
| `outline` | `#E5E7EB` (200) | `border-outline-200` |

### Anti-Patterns to Avoid
- DO NOT hardcode hex colors anywhere in components — always use design tokens via NativeWind classes
- DO NOT use inline `style={{ }}` for colors — use NativeWind className
- DO NOT install Gluestack components manually by copying files — always use `npx gluestack-ui add`
- DO NOT use `<Button>Label</Button>` — Gluestack requires compound pattern: `<Button><ButtonText>Label</ButtonText></Button>`
- DO NOT skip the `GluestackUIProvider` wrapper — all Gluestack components require it
- DO NOT install custom fonts — system fonts only (San Francisco / Roboto)
- DO NOT use `styled()` from older Gluestack versions — v3 uses `tva()` and NativeWind
- DO NOT set text smaller than 12px (`<Text size="xs">`) — minimum per CLAUDE.md
- DO NOT set body text smaller than 16px (`<Text size="md">`) — field-use default
- DO NOT create interactive elements smaller than 48x48px — minimum touch target for gloved field use
- DO NOT use color alone for status — always pair with icons, labels, and text (WCAG AA)
- DO NOT skip the `content` paths in `tailwind.config.ts` for `packages/ui/` — shared components need Tailwind classes purged correctly

### Project Structure Notes
- `apps/mobile/tailwind.config.ts` — Tailwind/NativeWind configuration with Broodly tokens
- `apps/mobile/config.ts` — Gluestack UI v3 provider configuration
- `apps/mobile/components/ui/` — Gluestack components installed via CLI
- `apps/mobile/app/_layout.tsx` — App root with `<GluestackUIProvider>` wrapper
- `apps/mobile/app/index.tsx` — Smoke test screen
- `apps/mobile/app/__tests__/smoke-test.test.tsx` — Component render tests
- `apps/mobile/babel.config.js` — Includes NativeWind babel plugin
- `apps/mobile/metro.config.js` — Includes NativeWind CSS transformer

### References
- [Source: CLAUDE.md#Design System Foundation: Gluestack UI v3]
- [Source: CLAUDE.md#Color Token System]
- [Source: CLAUDE.md#Typography — Gluestack Heading & Text]
- [Source: CLAUDE.md#Spacing & Layout]
- [Source: CLAUDE.md#Gluestack Component Compound Pattern]
- [Source: CLAUDE.md#Variant Dimensions (tva)]
- [Source: CLAUDE.md#Contrast Requirements]
- [Source: CLAUDE.md#Accessibility Requirements]
- [Source: architecture.md#Frontend Architecture]
- [Source: architecture.md#Verified Current Versions]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
