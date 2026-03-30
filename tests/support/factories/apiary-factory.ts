let counter = 0;

function nextId(): number {
  return ++counter;
}

export type CreateApiaryInput = {
  name?: string;
  latitude?: number;
  longitude?: number;
  region?: string;
  elevationOffset?: number;
  bloomOffset?: number;
};

export function buildCreateApiaryInput(overrides: CreateApiaryInput = {}): Required<CreateApiaryInput> {
  const id = nextId();
  return {
    name: overrides.name ?? `Test Apiary ${id}`,
    latitude: overrides.latitude ?? 47.6062 + id * 0.001,
    longitude: overrides.longitude ?? -122.3321 + id * 0.001,
    region: overrides.region ?? 'Pacific Northwest',
    elevationOffset: overrides.elevationOffset ?? 0,
    bloomOffset: overrides.bloomOffset ?? 0,
  };
}
