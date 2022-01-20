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
  /** Useful when working offline, will fallback to webpack normal behaviour */
  disable?: boolean;
  /**
   * Determine if it should load the development or the production version of modules
   * @default `mode`
   */
  env?: string;
  /** List the only modules that should be served by the cdn */
  only?: string[];
  /** List the modules that will always be bundled (not be served by the cdn) */
  exclude?: string[];
  /** Log whether the library is being served by the cdn or is bundled */
  verbose?: boolean;
  /**
   * Allow you to define a custom module resolver, it can either be a `function` or an npm module.
   * The resolver should return (or resolve as a Promise) either `null` or an `object` with the keys: `name`, `var`, `url`, `version`.
   * @default require('module-to-cdn')
   */
  resolver?: string | CdnModuleResolver;
  /**
   * Inject the CDN script tags into the `HtmlWebpackPlugin`, if available
   * @default !loadScripts // (`true`, unless `options.loadScripts` is true)
   */
  html?: boolean;
  /**
   * Instead of expecting the scripts to already be loaded via a `<script src="..."></script>` in the html, load them dynamically.
   * @see https://webpack.js.org/configuration/externals/#externalstypescript Uses webpack externalsType.script
   */
  loadScripts?: boolean;
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
