import { Component, OnInit, TemplateRef, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import {
  IManagedObject,
  IUser,
  InventoryBinaryService,
  InventoryService,
  OperationStatus,
  UserService,
} from "@c8y/client";
import { DeviceOperation } from "../configuration/DeviceOperation";
import {
  DeviceOperationElement,
  ParamType,
} from "../configuration/DeviceOperationElement";
import { FormlyFormOptions, FormlyFieldConfig } from "@ngx-formly/core";
import { TedgeService } from "../service/TedgeService";
import {
  ActionControl,
  AlertService,
  BuiltInActionType,
  BulkActionControl,
  Column,
  ModalService,
  OperationRealtimeService,
  Pagination,
  Status,
} from "@c8y/ngx-components";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { FormGroup } from "@angular/forms";
import * as _ from "lodash";
import { Profile } from "../configuration/Profile";
import {
  RepositoryService,
  RepositoryType,
} from "@c8y/ngx-components/repository/shared";

@Component({
  selector: "tedge-device",
  templateUrl: "./tedge-device.component.html",
})
export class TedgeDeviceComponent implements OnInit {
  device: IManagedObject;
  profile: Profile;
  form = new FormGroup({});
  parameterValues: any = {};
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[][] = new Array<FormlyFieldConfig[]>();
  JSON;
  currentTab; // = this.tabs[0];
  //profiles: Map<string, IManagedObject>;
  //currentProfile: string;
  currentAction: DeviceOperation;
  @ViewChild("actionModal", { static: false })
  actionModal: TemplateRef<any>;
  actionModalRef: BsModalRef;

  networkColumns: Column[] = [
    { name: "name", header: "Name", path: "name" },
    { name: "ip", header: "IP", path: "ip" },
    { name: "gateway", header: "Gateway", path: "gateway" },
    { name: "status", header: "Status", path: "status" },
  ];

  packageColumns: Column[] = [
    { name: "name", header: "Name", path: "name" },
    { name: "version", header: "Version", path: "version" },
    { name: "update", header: "Update", path: "update" },
  ];
  /** Initial pagination settings. */
  pagination: Pagination = {
    pageSize: 30,
    currentPage: 1,
  };
  /** Will allow for selecting items and perform bulk actions on them. */
  selectable: boolean = true;
  /**
   * Defines actions for individual rows.
   * `type` can be one of the predefined ones, or a custom one.
   * `callback` executes the action (based on the selected item object).
   */
  networkActionControls: ActionControl[] = [
    {
      type: BuiltInActionType.Edit,
      callback: (selectedItem) => this.onNetworkEdit(selectedItem),
    },
    {
      type: BuiltInActionType.Delete,
      callback: (selectedItem) => this.onNetworkDelete(selectedItem),
    },
  ];

  packageActionControls: ActionControl[] = [
    {
      type: "UPGRADE",
      icon: "installing-updates",
      callback: (selectedItem) => this.upgradePackage(selectedItem),
    },
  ];

  bulkPackageActionControls: BulkActionControl[] = [
    {
      type: "UPGRADE",
      icon: "installing-updates",
      callback: (ids) => this.upgradePackages(ids),
    },
  ];

  sshAdmin: boolean = false;
  tables = {};

  constructor(
    private route: ActivatedRoute,
    private inventory: InventoryService,
    private repositoryService: RepositoryService,
    private binaryService: InventoryBinaryService,
    private tedgeService: TedgeService,
    private modalService: BsModalService,
    private modalService2: ModalService,
    private userService: UserService,
    private operationsRT: OperationRealtimeService,
    private alert: AlertService
  ) {
    this.JSON = JSON;
    operationsRT.start();
  }

  async ngOnInit(): Promise<void> {
    await this.loadDevice();
    //this.profiles = await this.sshService.getProfiles();
    //this.currentProfile = this.device.profile;
    this.loadProfile();
    this.isSshAdmin();
    this.operationsRT.onUpdate$(this.device.id).subscribe((op) => {
      console.log(op);
      if (op.actionId) {
        let action: DeviceOperation = this.getAction(op.actionId);
        if (op.status == OperationStatus.FAILED) {
          this.alert.danger(
            "Action " + action.name + " failed.",
            op.failureReason
          );
          this.loadDevice();
        }
        if (op.status == OperationStatus.SUCCESSFUL) {
          this.alert.success(
            "Action " + action.name + " succeeded",
            op.c8y_Command.result
          );
          this.loadDevice();
        }
      }
    });
  }

  async isSshAdmin() {
    let user: IUser = (await this.userService.current()).data;
    console.log(user);
    this.sshAdmin = this.userService.hasRole(user, "ROLE_SSH_ADMIN");
  }

  async loadProfile() {
    let soft = this.device.c8y_SoftwareList.filter((s) =>
      s.version.endsWith("tedge-profile")
    )[0];
    console.log(soft);
    if (!soft) {
      this.alert.danger(
        "This device has no profile installed. Please install a profile using the Software tab."
      );
      return;
    }
    let profiles: IManagedObject = (
      await this.repositoryService.listRepositoryEntries(
        RepositoryType.SOFTWARE,
        {
          query: {
            __filter: {
              __and: {
                name: soft.name,
                softwareType: "tedge-profile",
              },
            },
          },
        }
      )
    ).data[0];
    console.log(profiles);
    if (!profiles || !profiles.childAdditions) {
      this.alert.danger(
        `There is no file associated to installed profile (${soft.name}, ${soft.version}), or the software type is not 'tedge-profile'.`
      );
      return;
    }
    profiles.childAdditions?.references.forEach(async (v) => {
      let version = (await this.inventory.detail(v.managedObject.id)).data;
      console.log(version);
      if (version.c8y_Software.version == soft.version) {
        this.profile = await (
          await this.binaryService.download(
            version.childAdditions.references[0]?.managedObject.id
          )
        ).json();
        this.postProcessProfile();
      }
    });
  }

  async postProcessProfile() {
    this.fields = new Array<FormlyFieldConfig[]>();
    this.profile.actions.forEach((action) => {
      this.fields[action.id] = this.getFields(action);
    });
    this.profile.properties.forEach((prop) => {
      if (prop.json) {
        this.tables[prop.name] = {
          headers: this.getHeaders(this.device[prop.name]),
          actions: this.getActions(prop.name),
        };
      }
    });
    this.currentTab = this.profile.categories[0];
    this.currentTab.active = "active";
  }

  getSimpleActions(category: string) {
    return this.profile.actions.filter(
      (a) => !a.tableRowAction && a.categories.includes(category)
    );
  }

  changeTab(e: Event, tab) {
    e.preventDefault();
    this.currentTab.active = "";
    tab.active = "active";
    this.currentTab = tab;
  }

  filterProperties(category: string) {
    return this.profile.properties.filter((p) =>
      p.categories.includes(category)
    );
  }

  async loadDevice() {
    this.device = (
      await this.inventory.detail(
        this.route.snapshot.parent.data.contextData.id
      )
    ).data;
  }

  getFieldFromElement(element: DeviceOperationElement): FormlyFieldConfig {
    let field: FormlyFieldConfig = {
      key: element.id,
      templateOptions: { label: element.name },
    };

    switch (element.type) {
      case ParamType.STRING:
        field.type = "input";
        field.templateOptions.type = "text";
        break;
      case ParamType.INTEGER:
      case ParamType.FLOAT:
        field.type = "input";
        field.templateOptions.type = "number";
        break;
      case ParamType.BOOL:
        field.type = "checkbox";
        break;
      case ParamType.DATE:
        field.type = "date-time";
        break;
      case ParamType.ENUM:
        field.type = "radio";
        field.templateOptions.options = element.values.map((e) => {
          return { label: e, value: e };
        });
        break;
      case ParamType.FILE:
        field.type = "file";
        field.hooks = {
          onChanges: (e) => console.log(e),
          onInit: (field) => console.log(field),
        };
        break;
      case ParamType.GROUP:
        if (element.dependsOnParam) {
          field.hideExpression = () => {
            return this.parameterValues[element.dependsOnParamId]
              ? this.parameterValues[element.dependsOnParamId].toString() !=
                  element.dependsOnParamValue
              : true;
          };
        }
        if (element.repeatable) {
          field.type = "repeat";
          field.templateOptions.addText = "Add " + element.name;
          field.templateOptions.removeText = "Remove " + element.name;
          field.templateOptions.minOccur = element.minOccur;
          field.templateOptions.maxOccur = element.maxOccur;
          field.fieldArray = {
            templateOptions: { label: element.name },
            wrappers: ["panel"],
            fieldGroup: element.elements.map((e) =>
              this.getFieldFromElement(e)
            ),
          };
          if (element.minOccur > 0) {
            field.defaultValue = [];
            for (let i = 0; i < element.minOccur; i++) {
              field.defaultValue.push({});
            }
          }
        } else {
          field.wrappers = ["panel"];
          field.fieldGroup = element.elements.map((e) =>
            this.getFieldFromElement(e)
          );
        }
        break;
    }

    return field;
  }

  getFields(command: DeviceOperation): FormlyFieldConfig[] {
    return command?.elements
      ? command.elements.map((e) => this.getFieldFromElement(e))
      : [];
  }

  async reboot() {
    let confirm = await this.modalService2.confirm(
      "Reboot confirmation",
      "Are you sure you want to reboot now?",
      Status.DANGER
    );
    if (confirm) {
      this.tedgeService.reboot(this.device.id);
    }
  }

  async runAction(actionId: string) {
    this.currentAction = this.getAction(actionId);
    if (this.currentAction) {
      if (this.currentAction.confirmation) {
        try {
          let confirm = await this.modalService2.confirm(
            this.currentAction.name,
            "Are you sure to perform this action?",
            Status.DANGER
          );
          if (confirm) {
            await this.tedgeService.executeAction(
              this.device.id,
              actionId,
              {},
              "Execute " + this.currentAction.name
            );
            this.loadDevice();
          }
        } catch (e) {
          console.log("error is: " + e);
        }
      } else if (this.currentAction.elements.length > 0) {
        this.actionModalRef = this.modalService.show(this.actionModal, {
          backdrop: true,
          ignoreBackdropClick: true,
        });
      } else {
        await this.tedgeService.executeAction(
          this.device.id,
          actionId,
          this.parameterValues,
          "Execute " + this.currentAction.name
        );
        this.loadDevice();
      }
    } else {
      this.alert.danger(
        `Action ${actionId} is not defined in current device profile.`
      );
    }
  }

  getAction(actionId: string): DeviceOperation {
    let result = this.profile.actions.filter((a) => a.id == actionId);
    if (result.length > 0) {
      return result[0];
    } else {
      return null;
    }
  }

  resolveFiles() {
    let fileContent: Map<string, any> = new Map<string, any>();
    this.currentAction.elements.forEach(async (e) => {
      if (e.type == ParamType.FILE && this.parameterValues[e.id]) {
        fileContent.set(e.id, {
          name: this.parameterValues[e.id][0].file.name,
          content: await this.parameterValues[e.id][0].readAsText(),
        });
      } else if (e.type == ParamType.GROUP && this.parameterValues[e.id]) {
        fileContent.set(e.id, new Map<string, any>());
        e.elements.forEach(async (se) => {
          if ((se.type = ParamType.FILE && this.parameterValues[e.id][se.id])) {
            fileContent.get(e.id).set(se.id, {
              name: this.parameterValues[e.id][se.id][0].file.name,
              content: await this.parameterValues[e.id][se.id][0].readAsText(),
            });
          } else {
            fileContent.get(e.id).set(se.id, this.parameterValues[e.id][se.id]);
          }
        });
      } else {
        fileContent.set(e.id, this.parameterValues[e.id]);
      }
    });
    return fileContent;
  }

  endRunAction() {
    console.log(this.parameterValues);
    let fileContent = this.resolveFiles();
    console.log(fileContent);
    this.tedgeService.executeAction(
      this.device.id,
      this.currentAction.id,
      this.parameterValues,
      "Execute " + this.currentAction.name
    );
    this.actionModalRef.hide();
    this.loadDevice();
  }

  getHeaders(array) {
    if (array && array.length > 0) {
      return Object.keys(array[0]).map((h) => {
        return { name: h, header: h, path: h };
      });
    }
  }

  getActions(propertyName) {
    return this.profile.actions
      .filter((a) => a.tableRowAction && a.tableName == propertyName)
      .map((a) => {
        return {
          type: a.id,
          icon: a.icon,
          callback: async (selectedItem) => {
            console.log("Will run " + a.name + " on item " + selectedItem);
            this.parameterValues = selectedItem;
            await this.runAction(a.id);
          },
        };
      });
  }

  async onNetworkEdit(item) {
    this.parameterValues = item;
    await this.runAction("updateNetwork");
  }

  async onNetworkDelete(item) {
    this.parameterValues = item;
    await this.runAction("deleteNetwork");
  }

  getValue(object, path) {
    return _.get(object, path);
  }

  async upgradePackage(selectedItem) {
    this.parameterValues = selectedItem;
    await this.runAction("upgradePackage");
    console.log(selectedItem);
  }

  async upgradePackages(ids) {
    console.log(ids);
  }
}
