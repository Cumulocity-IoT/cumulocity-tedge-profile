import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import {
  IManagedObject,
  InventoryService,
  OperationService,
  QueriesUtil,
  UserService,
} from "@c8y/client";
import {
  ActionControl,
  BulkActionControl,
  CellRendererContext,
  Column,
  CustomColumn,
  DATA_GRID_CONFIGURATION_CONTEXT_PROVIDER,
  DATA_GRID_CONFIGURATION_STRATEGY,
  GridConfigContext,
  GridConfigContextProvider,
  Pagination,
  UserPreferencesConfigurationStrategy,
  _,
} from "@c8y/ngx-components";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import {
  DeviceGridComponent,
  DeviceGridService,
} from "@c8y/ngx-components/device-grid";

@Component({
  selector: "tedge-registration",
  templateUrl: "./tedge-registration.component.html",
  providers: [
    {
      provide: DATA_GRID_CONFIGURATION_STRATEGY,
      useClass: UserPreferencesConfigurationStrategy,
    },
    {
      provide: DATA_GRID_CONFIGURATION_CONTEXT_PROVIDER,
      useExisting: TedgeRegistrationComponent,
    },
  ],
})
export class TedgeRegistrationComponent
  implements OnInit, GridConfigContextProvider
{
  devices: IManagedObject[];
  informationText: string;
  deviceToDelete: IManagedObject;
  devicesToDelete: string[];
  deviceToReboot: IManagedObject;
  deviceToChange: IManagedObject;
  @ViewChild("deleteDevicesModal", { static: false })
  deleteDevicesModal: TemplateRef<any>;
  deleteDevicesModalRef: BsModalRef;
  @ViewChild("rebootDeviceModal", { static: false })
  rebootDeviceModal: TemplateRef<any>;
  rebootDeviceModalRef: BsModalRef;
  @ViewChild("rebootDevicesModal", { static: false })
  rebootDevicesModal: TemplateRef<any>;
  rebootDevicesModalRef: BsModalRef;
  @ViewChild("deviceGrid")
  deviceGrid: DeviceGridComponent;
  queriesUtil: QueriesUtil;
  columns: Column[];
  pagination: Pagination = {
    pageSize: 30,
    currentPage: 1,
  };
  actionControls: ActionControl[] = [
    {
      type: "REBOOT",
      text: "Reboot",
      icon: "refresh",
      callback: (item) => this.reboot(<IManagedObject>item),
    },
  ];
  bulkActionControls: BulkActionControl[] = [
    {
      type: "REBOOT",
      text: "Reboot",
      icon: "refresh",
      callback: (items) => this.rebootAll(items),
    },
    {
      type: "DELETE",
      text: "Delete",
      icon: "trash",
      callback: (items) => this.deleteAll(items),
    },
  ];
  @Output() onColumnsChange: EventEmitter<Column[]> = new EventEmitter<
    Column[]
  >();
  @Output() onDeviceQueryStringChange: EventEmitter<string> =
    new EventEmitter<string>();

  devicesToReboot: string[];
  baseQuery = {
    __filter: {
      type: "thin-edge.io",
    },
    __orderby: [],
  };

  @ViewChild(DeviceGridComponent, { static: true })
  dataGrid: DeviceGridComponent;

  readonly GRID_CONFIG_KEY = "device-grid-all";

  constructor(
    private inventory: InventoryService,
    private modalService: BsModalService,
    private deviceGridService: DeviceGridService,
    private operationService: OperationService,
    public userService: UserService
  ) {
    // _ annotation to mark this string as translatable string.
    this.informationText = _(
      "Ooops! It seems that there is no device to display."
    );
    this.queriesUtil = new QueriesUtil();
  }

  getGridConfigContext(): GridConfigContext {
    return {
      key: this.GRID_CONFIG_KEY,
      defaultColumns: this.deviceGridService.getDefaultColumns(),
      legacyConfigKey: "all-devices-columns-meta_",
      legacyFilterKey: "all-devices-columns-config",
    };
  }

  async ngOnInit(): Promise<void> {
    console.log("In ngOnInit");
    this.columns = this.deviceGridService.getDefaultColumns();
    console.log(this.columns);
    const profileColumn = new CustomColumn();
    profileColumn.name = "profile";
    profileColumn.path = "profile";
    profileColumn.header = "Profile";
    profileColumn.cellRendererComponent = ProfileCellRendererComponent;
    this.columns.push(profileColumn);
    //this.columns[6].visible = false;
    //this.columns[7].visible = false;
    this.columns.push(
      {
        name: "hostname",
        path: "hostname",
        header: "Hostname",
      },
      {
        name: "ip",
        path: "ip",
        header: "IP",
      },
      {
        name: "gateway",
        path: "gateway",
        header: "Gateway",
      },
      {
        name: "netmask",
        path: "netmask",
        header: "Netmask",
      },
      {
        name: "broadcast",
        path: "broadcast",
        header: "Broadcast",
      },
      {
        name: "mac",
        path: "mac",
        header: "Mac address",
      }
    );
  }

  reboot(device: IManagedObject) {
    this.deviceToReboot = device;
    this.rebootDeviceModalRef = this.modalService.show(this.rebootDeviceModal, {
      backdrop: true,
      ignoreBackdropClick: true,
    });
  }

  rebootAll(selectedIds: string[]) {
    this.devicesToReboot = selectedIds;
    this.rebootDevicesModalRef = this.modalService.show(
      this.rebootDevicesModal,
      { backdrop: true, ignoreBackdropClick: true }
    );
  }

  deleteAll(selectedIds: string[]) {
    this.devicesToDelete = selectedIds;
    this.deleteDevicesModalRef = this.modalService.show(
      this.deleteDevicesModal,
      { backdrop: true, ignoreBackdropClick: true }
    );
  }

  async endDeleteAll() {
    this.devicesToDelete.forEach(async (id) => {
      await this.inventory.delete(id);
    });
    this.deleteDevicesModalRef.hide();
    this.dataGrid.refresh.emit();
  }

  async endReboot() {
    await this.operationService.create({
      deviceId: this.deviceToReboot.id,
      c8y_Restart: {},
    });

    this.rebootDeviceModalRef.hide();
    this.dataGrid.refresh.emit();
  }

  async endRebootAll() {
    this.devicesToReboot.forEach(async (id) => {
      await this.operationService.create({
        deviceId: id,
        c8y_Restart: {},
      });
    });
    this.rebootDevicesModalRef.hide();
    this.dataGrid.refresh.emit();
  }
}

@Component({
  template: ` {{ value }} `,
})
export class ProfileCellRendererComponent {
  get value() {
    let software = this.context.item.c8y_SoftwareList?.filter((s) =>
      s.version.endsWith("::shell-commands")
    )[0];
    return software
      ? software.name + " " + software.version.split("::")[0]
      : "no profile";
  }

  constructor(public context: CellRendererContext) {}
}
