import { CdnModuleResolver } from './types';

export default function getResolver(
  resolver?: string | CdnModuleResolver
): CdnModuleResolver {
  if (typeof resolver === 'function') return resolver;
  /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-require-imports */
  if (typeof resolver === 'string') return require(resolver);
  return require('module-to-cdn');
}
