import type { Chunk, Module } from 'webpack';

type ChunkGroup = Parameters<Chunk['addGroup']>[0];
type ChunkGroupOptions = ChunkGroup['options'];
type DependencyLocation = Parameters<ChunkGroup['addOrigin']>[1];

export type CdnModuleResolver = (
  moduleName: string,
  version: string,
  options: { env: string }
) => Promise<CdnModuleInfo> | CdnModuleInfo;

export interface CdnModuleInfo {
  /** name of the module */
  name: string;
  /** name of the module */
  var: string;
  /** url where the module is available */
  url: string;
  /** the version asked for */
  version: string;
}

export interface PluginOptions {
  disable?: boolean;
  env?: string;
  only?: string[];
  exclude?: string[];
  verbose?: boolean;
  resolver?: string | CdnModuleResolver;
}

declare module 'webpack' {
  // https://github.com/webpack/webpack/pull/15187
  class Compilation {
    addChunkInGroup(groupOptions: string | ChunkGroupOptions): ChunkGroup;
    addChunkInGroup(
      groupOptions: string | ChunkGroupOptions,
      module: Module,
      loc: DependencyLocation,
      request: string
    ): ChunkGroup;
  }
}
