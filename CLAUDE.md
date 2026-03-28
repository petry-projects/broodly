@https://raw.githubusercontent.com/petry-projects/.github/main/AGENTS.md
@AGENTS.md

# Broodly — Claude Code Project Context

For comprehensive project guidelines (design system, components, Figma integration, architecture), see [AGENTS.md](./AGENTS.md).

## Quick Reference

- **Figma Design File:** https://www.figma.com/design/pL2D8Cvu6XdrI9NBREr3nE/Broodly
- **Stack:** Expo + React Native + TypeScript + Gluestack UI v3 + NativeWind
- **Backend:** Go (chi + gqlgen) on GCP
- **Planning artifacts:** `_bmad-output/planning-artifacts/`

## Key Rules

1. **Figma MCP flow** — always run `get_design_context` + `get_screenshot` before implementing any design
2. **Gluestack UI v3** — use as component foundation, never build custom when a primitive exists
3. **Compound components** — always use full Gluestack patterns (e.g., `<Button><ButtonText>...</ButtonText></Button>`)
4. **Color tokens only** — never hardcode hex colors, use `bg-primary-500`, `text-error-600`, etc.
5. **WCAG 2.1 AA** — all pairings must meet contrast ratios, status is never color-only
6. **48px minimum touch targets** — for all interactive elements (gloved field use)
7. **Shared UI in `packages/ui/`** — feature components in `apps/mobile/src/features/`

See [AGENTS.md](./AGENTS.md) for full details.
