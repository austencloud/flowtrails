/**
 * Barrel export for InversifyJS setup
 */

import { container } from './container';

export { container } from './container';
export { TYPES } from './types';

// Helper function for service resolution
export function resolve<T>(serviceIdentifier: symbol): T {
  return container.get<T>(serviceIdentifier);
}
