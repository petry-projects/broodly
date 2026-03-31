import { mergeTests } from '@playwright/test';
import { test as graphqlFixture } from './graphql-fixture';
import { test as authFixture } from './auth-fixture';

export const test = mergeTests(graphqlFixture, authFixture);
export { expect } from '@playwright/test';
