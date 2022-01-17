declare module 'webpack/lib/ExternalModule' {
  import { ExternalModule as ExternalModuleType } from 'webpack';
  declare class ExternalModule extends ExternalModuleType {}
  export default ExternalModule;
}
