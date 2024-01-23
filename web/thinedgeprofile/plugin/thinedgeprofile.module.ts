import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import {
  CoreModule,
  FormsModule,
  HOOK_NAVIGATOR_NODES,
  HOOK_ROUTE,
  ModalModule,
  ViewContext,
} from "@c8y/ngx-components";
import {
  ProfileCellRendererComponent,
  TedgeRegistrationComponent,
} from "./registration/tedge-registration.component";
import { TedgeConfigurationComponent } from "./configuration/tedge-configuration.component";
import { TedgeNavigationFactory } from "./factories/Navigation";
import { FormlyModule } from "@ngx-formly/core";
import { PanelWrapperComponent } from "./panel-wrapper.component";
import { RepeatTypeComponent } from "./repeat-section.type";
import { TedgeDeviceComponent } from "./device/tedge-device.component";
import { TedgeGuard } from "./device/tedge.guard";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { DeviceGridModule } from "@c8y/ngx-components/device-grid";
import { CollapseModule } from "ngx-bootstrap/collapse";
import { SharedRepositoryModule } from "@c8y/ngx-components/repository/shared";

/**
 * Angular Routes.
 * Within this array at least path (url) and components are linked.
 */
const routes: Routes = [
  {
    path: "tedge-devices",
    component: TedgeRegistrationComponent,
  },
  {
    path: "tedge-profiles",
    component: TedgeConfigurationComponent,
  },
];

@NgModule({
  declarations: [
    TedgeRegistrationComponent,
    TedgeConfigurationComponent,
    RepeatTypeComponent,
    PanelWrapperComponent,
    TedgeDeviceComponent,
    ProfileCellRendererComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    CoreModule,
    ModalModule,
    DragDropModule,
    DeviceGridModule,
    CollapseModule,
    SharedRepositoryModule,
    FormlyModule.forRoot({
      types: [{ name: "repeat", component: RepeatTypeComponent }],
      wrappers: [{ name: "panel", component: PanelWrapperComponent }],
    }),
  ],
  providers: [
    {
      provide: HOOK_NAVIGATOR_NODES,
      useClass: TedgeNavigationFactory,
      multi: true,
    },
    {
      provide: HOOK_ROUTE,
      useValue: [
        {
          context: ViewContext.Device,
          path: "tedge_config",
          component: TedgeDeviceComponent,
          label: "Thin-edge",
          priority: 100,
          icon: "remote-desktop1",
          canActivate: [TedgeGuard],
        },
      ],
      multi: true,
    },
  ],
})
export class ThinEdgeProfileModule {}
