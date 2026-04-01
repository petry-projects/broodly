# Broodly

Field-first beekeeping decision-support app. Mobile-first on iOS, Android, and web via a single Expo + React Native codebase with a Go GraphQL API backend on GCP.

## Prerequisites

- **Node.js** >= 20.x (LTS)
- **pnpm** >= 9.x
- **Go** >= 1.24
- **Expo CLI** (`npx expo`)
- **Terraform** >= 1.5 (for infrastructure)

## Getting Started

```bash
# Install dependencies
pnpm install

# Run mobile app (Expo)
pnpm --filter mobile start

# Run API server (Go)
cd apps/api && go run cmd/server/main.go
```

## Infrastructure Setup

GCP infrastructure is fully automated via GitHub Actions. Two manual steps are required for initial setup:

1. Create a temporary GCP service account key
2. Add it as a GitHub secret

Then run the bootstrap workflow — it provisions all cloud resources and configures CI/CD automatically.

See **[GCP Bootstrap Runbook](docs/runbooks/gcp-bootstrap.md)** for step-by-step instructions.

## Monorepo Structure

```
broodly/
├── apps/
│   ├── mobile/          # Expo app (iOS, Android, Web)
│   └── api/             # Go GraphQL API service
├── packages/
│   ├── ui/              # Shared UI component library
│   ├── graphql-types/   # Generated TypeScript types
│   ├── domain-types/    # Shared constants and domain types
│   ├── config/          # Shared configuration
│   └── test-utils/      # Shared testing utilities
├── infra/
│   └── terraform/       # IaC for GCP resources
├── tests/
│   ├── integration/     # Integration tests
│   └── e2e/             # End-to-end tests
└── docs/                # Architecture docs, ADRs, runbooks
```

## License

Broodly is dual-licensed:

- **AGPL-3.0:** [GNU Affero General Public License v3.0](LICENSE) — available for any use, provided you comply with its copyleft and network-source obligations
- **Commercial:** [Commercial License](LICENSE-COMMERCIAL.md) — for users who prefer or require a proprietary/closed-source license

For commercial licensing inquiries, contact [licensing@djpetry.com](mailto:licensing@djpetry.com).

### Contributing

By contributing to this project, you agree to the [Contributor License Agreement](CLA.md).
