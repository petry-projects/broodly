describe('Workspace resolution', () => {
  it('imports @broodly/domain-types without error', () => {
    const domainTypes = require('@broodly/domain-types');
    expect(domainTypes).toBeDefined();
  });

  it('imports @broodly/config without error', () => {
    const config = require('@broodly/config');
    expect(config).toBeDefined();
  });

  it('imports @broodly/ui without error', () => {
    const ui = require('@broodly/ui');
    expect(ui).toBeDefined();
  });

  it('imports @broodly/graphql-types without error', () => {
    const graphqlTypes = require('@broodly/graphql-types');
    expect(graphqlTypes).toBeDefined();
  });
});
