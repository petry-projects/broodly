let counter = 0;

function nextId(): number {
  return ++counter;
}

export type CreateUserInput = {
  displayName?: string;
  email?: string;
  experienceLevel?: 'NEWBIE' | 'AMATEUR' | 'SIDELINER';
  region?: string;
};

export function buildCreateUserInput(overrides: CreateUserInput = {}): Required<CreateUserInput> {
  const id = nextId();
  return {
    displayName: overrides.displayName ?? `Test Beekeeper ${id}`,
    email: overrides.email ?? `test-beekeeper-${id}@broodly-test.local`,
    experienceLevel: overrides.experienceLevel ?? 'NEWBIE',
    region: overrides.region ?? 'Pacific Northwest',
  };
}
