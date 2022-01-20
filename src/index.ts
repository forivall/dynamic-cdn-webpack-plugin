import type HtmlWebpackPlugin from 'html-webpack-plugin';
import readPkgUp from 'read-pkg-up';
import resolvePkg from 'resolve-pkg';
import { ExternalModule } from 'webpack';
import type { Compiler } from 'webpack';

import getResolver from './get-resolver';
import { CdnModuleInfo, CdnModuleResolver, PluginOptions } from './types';

const pluginName = 'dynamic-cdn-webpack-plugin';
const moduleRegex = /^((?:@[a-z\d][\w-.]+\/)?[a-z\d][\w-.]*)/;

const getEnvironment = (mode: string | undefined) => {
  switch (mode) {
    case 'none':
    case 'development':
      return 'development';
    default:
      return 'production';
  }
};

export default class DynamicCdnWebpackPlugin {
  disable: boolean;
  env: string | undefined;
  exclude: string[];
  only?: string[];
  verbose: boolean;
  resolver: CdnModuleResolver;
  modulesFromCdn: { [modulePath: string]: CdnModuleInfo };
  loadScripts: boolean;
  htmlWebpackPlugin?: typeof HtmlWebpackPlugin;

  constructor(
    options: PluginOptions = {},
    htmlWebpackPlugin?: typeof HtmlWebpackPlugin | false
  ) {
    const {
      disable = false,
      env,
      exclude,
      only,
      verbose,
      resolver,
      loadScripts = false,
      html = !loadScripts,
    } = options;
    if (exclude && only) {
      throw new Error("You can't use 'exclude' and 'only' at the same time");
    }

    this.disable = disable;
    this.env = env;
    this.exclude = exclude ?? [];
    this.only = only;
    this.verbose = verbose === true;
    this.resolver = getResolver(resolver);
    this.loadScripts = loadScripts;
    this.modulesFromCdn = {};
    this.htmlWebpackPlugin = (html && htmlWebpackPlugin) || undefined;

    // Support for old way without passing htmlWebpackPlugin as an argument
    if (htmlWebpackPlugin === undefined) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
        this.htmlWebpackPlugin = require('html-webpack-plugin');
      } catch (_: unknown) {}
    }
  }

  apply(compiler: Compiler) {
    if (this.disable) return;

    // Find the external modules
    const env = this.env ?? getEnvironment(compiler.options.mode);
    compiler.hooks.normalModuleFactory.tap(pluginName, (nmf) => {
      nmf.hooks.resolve.tapPromise(pluginName, async (data) => {
        const modulePath = data.dependencies[0].request;
        const contextPath = data.context;

        // Unrecognized as a module so use default
        if (!moduleRegex.test(modulePath)) return;

        // Use recognized CDN module if found
        const info = await this.addModule(contextPath, modulePath, { env });
        if (!info) return;

        const varName = info.var;

        return this.loadScripts
          ? new ExternalModule([info.url, varName], 'script', modulePath)
          : new ExternalModule(varName, 'var', modulePath);
      });
    });

    // Make the external modules available to other plugins
    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      compilation.hooks.beforeModuleAssets.tap(pluginName, () => {
        for (const [name, cdnConfig] of Object.entries(this.modulesFromCdn)) {
          compilation.addChunkInGroup(name);
          const chunk = compilation.addChunk(name);
          chunk.files.add(cdnConfig.url);
        }
      });

      // Optionally, update the HtmlWebpackPlugin assets
      const isUsingHtmlWebpackPlugin =
        typeof this.htmlWebpackPlugin === 'function' &&
        compiler.options.plugins.some(
          (x) => x instanceof this.htmlWebpackPlugin!
        );

      if (isUsingHtmlWebpackPlugin) {
        const hooks = this.htmlWebpackPlugin!.getHooks(compilation);
        hooks.beforeAssetTagGeneration.tapAsync(
          pluginName,
          (htmlPluginData, callback) => {
            const { assets } = htmlPluginData;
            const scripts = Object.values(this.modulesFromCdn).map(
              (moduleFromCdn) => moduleFromCdn.url
            );
            assets.js = scripts.concat(assets.js);
            callback(null, htmlPluginData);
          }
        );
      }
    });
  }

  async addModule(
    contextPath: string,
    modulePath: string,
    { env }: { env: string }
  ): Promise<false | CdnModuleInfo> {
    const isModuleExcluded =
      this.exclude.includes(modulePath) ||
      (this.only && !this.only.includes(modulePath));

    if (isModuleExcluded) return false;

    const moduleName = moduleRegex.exec(modulePath)![1];
    /* istanbul ignore next */
    if (!moduleName) {
      if (this.verbose) console.log(`❌ '${modulePath}' failed to parse`);
      return false;
    }

    const modulePkg = await readPkgUp({
      cwd: resolvePkg(moduleName, { cwd: contextPath }),
    });
    /* istanbul ignore next */
    if (!modulePkg) {
      if (this.verbose) console.log(`❌ '${modulePath}' has no package.json`);
      return false;
    }

    const {
      packageJson: { version, peerDependencies },
    } = modulePkg;

    const isModuleAlreadyLoaded = Boolean(this.modulesFromCdn[modulePath]);
    if (isModuleAlreadyLoaded) {
      const isSameVersion = this.modulesFromCdn[modulePath].version === version;
      return isSameVersion ? this.modulesFromCdn[modulePath] : false;
    }

    const cdnConfig = await this.resolver(modulePath, version, { env });

    if (cdnConfig == null) {
      if (this.verbose) {
        console.log(
          `❌ '${modulePath}' couldn't be found, please add it to https://github.com/mastilver/module-to-cdn/blob/master/modules.json`
        );
      }

      return false;
    }

    if (this.verbose) {
      console.log(`✔️ '${cdnConfig.name}' will be served by ${cdnConfig.url}`);
    }

    if (peerDependencies) {
      const arePeerDependenciesLoaded = (
        await Promise.all(
          Object.keys(peerDependencies).map(async (peerDependencyName) =>
            this.addModule(contextPath, peerDependencyName, { env })
          )
        )
      )
        .map((x) => Boolean(x))
        .reduce((result, x) => result && x, true);

      if (!arePeerDependenciesLoaded) return false;
    }

    this.modulesFromCdn[modulePath] = cdnConfig;
    return cdnConfig;
  }
}
