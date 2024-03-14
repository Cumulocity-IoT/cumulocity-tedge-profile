import { NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouterModule as NgRouterModule } from "@angular/router";
import { UpgradeModule as NgUpgradeModule } from "@angular/upgrade/static";
import { CoreModule, RouterModule } from "@c8y/ngx-components";
import { AssetsNavigatorModule } from "@c8y/ngx-components/assets-navigator";
import { SubAssetsModule } from "@c8y/ngx-components/sub-assets";
import { ChildDevicesModule } from "@c8y/ngx-components/child-devices";
import { DeviceProfileModule } from "@c8y/ngx-components/device-profile";
import { DeviceShellModule } from "@c8y/ngx-components/device-shell";
import { OperationsModule } from "@c8y/ngx-components/operations";
import { RepositoryModule } from "@c8y/ngx-components/repository";
import {
  DashboardUpgradeModule,
  HybridAppModule,
  UpgradeModule,
  UPGRADE_ROUTES,
} from "@c8y/ngx-components/upgrade";
import { BinaryFileDownloadModule } from "@c8y/ngx-components/binary-file-download";
import { SearchModule } from "@c8y/ngx-components/search";
import {
  DeviceManagementHomeDashboardModule,
  DeviceInfoDashboardModule,
} from "@c8y/ngx-components/context-dashboard";
import { DiagnosticsModule } from "@c8y/ngx-components/diagnostics";
import { ThinEdgeProfileModule } from "./plugin/thinedgeprofile.module";

@NgModule({
  imports: [
    // Upgrade module must be the first
    UpgradeModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(),
    NgRouterModule.forRoot([...UPGRADE_ROUTES], {
      enableTracing: false,
      useHash: true,
    }),
    CoreModule.forRoot(),
    AssetsNavigatorModule.config({
      smartGroups: true,
    }),
    OperationsModule,
    NgUpgradeModule,
    DashboardUpgradeModule,
    RepositoryModule,
    DeviceProfileModule,
    BinaryFileDownloadModule,
    SearchModule,
    SubAssetsModule,
    ChildDevicesModule,
    DeviceManagementHomeDashboardModule,
    DeviceInfoDashboardModule,
    DeviceShellModule,
    DiagnosticsModule,
    ThinEdgeProfileModule,
  ],
})
export class AppModule extends HybridAppModule {
  constructor(protected upgrade: NgUpgradeModule) {
    super();
  }
}
