import { Component, OnInit } from "@angular/core";
import {
  IManagedObject,
  IUser,
  IdentityService,
  InventoryBinaryService,
  InventoryService,
  UserService,
} from "@c8y/client";
import { AlertService } from "@c8y/ngx-components";
import {
  RepositoryCategory,
  RepositoryService,
  RepositoryType,
} from "@c8y/ngx-components/repository/shared";
import { DeviceOperation } from "./DeviceOperation";
import { DeviceOperationElement, ParamType } from "./DeviceOperationElement";
import { Property } from "./Property";
import { Category } from "./Category";
import { Profile } from "./Profile";

@Component({
  selector: "tedge-configuration",
  templateUrl: "./tedge-configuration.component.html",
})
export class TedgeConfigurationComponent implements OnInit {
  profiles: IManagedObject[] = [];
  profileVersions: Profile[] = [];
  currentProfile: IManagedObject;
  currentProfileVersion: Profile = new Profile();

  categoriesTab = "active";
  propertiesTab = "";
  measurementsTab = "";
  actionsTab = "";
  property = {};

  sshAdmin: boolean = false;

  constructor(
    private repositoryService: RepositoryService,
    private binaryService: InventoryBinaryService,
    private inventoryService: InventoryService,
    private identityService: IdentityService,
    private alertService: AlertService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadProfiles();
    this.isSshAdmin();
  }

  async isSshAdmin() {
    let user: IUser = (await this.userService.current()).data;
    console.log(user);
    this.sshAdmin = this.userService.hasRole(user, "ROLE_SSH_ADMIN");
  }

  async loadProfiles() {
    this.profiles = (
      await this.repositoryService.listRepositoryEntries(
        RepositoryType.SOFTWARE,
        {
          query: {
            __filter: {
              softwareType: "tedge-profile",
            },
          },
        }
      )
    ).data;
  }

  async loadProfileVersions() {
    this.currentProfile.childAdditions = (
      await this.inventoryService.detail(this.currentProfile)
    ).data.childAdditions;
    console.log(this.currentProfile);
    let name = this.currentProfile.name;
    this.profileVersions = [];
    this.currentProfile.childAdditions?.references?.forEach(async (a) => {
      let v = (await this.inventoryService.detail(a.managedObject.id)).data;
      console.log(v);
      let version = v.c8y_Software?.version.split("::")[0];
      let profile: Profile = await (
        await this.binaryService.download(
          v.childAdditions.references[0].managedObject.id
        )
      ).json();
      profile.name = name;
      profile.version = version;
      profile.id = v.id;
      profile.binaryId = v.childAdditions.references[0].managedObject.id;
      console.log(profile);
      this.profileVersions.push(profile);
    });
    console.log(this.profileVersions);
  }

  selectedLabelFunction(categories: Category[]) {
    return categories?.map((c) => c.label).join(",");
  }

  selectedCategoriesChanged($event, prop) {
    console.log($event);
    console.log(prop);
    prop.selectedCategories = $event;
    prop.categories = $event.map((c) => c.name);
  }

  changeProfile() {
    console.log(this.currentProfileVersion);
    this.currentProfileVersion.properties?.forEach((prop) => {
      if (prop.categories) {
        prop["selectedCategories"] = prop.categories.map((c) => {
          return this.getCategoryByName(c);
        });
      }
    });
    this.currentProfileVersion.actions?.forEach((prop) => {
      if (prop.categories) {
        prop["selectedCategories"] = prop.categories.map((c) => {
          return this.getCategoryByName(c);
        });
      }
    });
  }

  getCategoryByName(name: string) {
    let c: Category = null;
    this.currentProfileVersion.categories?.forEach((cat) => {
      if (cat.name == name) {
        c = cat;
      }
    });
    return c;
  }

  getJsonProperties() {
    return this.currentProfileVersion.properties?.filter((prop) => prop.json);
  }

  async removeProfile() {
    console.log("Will delete profile " + this.currentProfileVersion.name);
    await this.inventoryService.delete(this.currentProfileVersion.id);
  }

  onUploadEditorLoad(e) {
    console.log("In onUploadEditorLoad");
    console.log(e);
  }

  goToCategories() {
    this.categoriesTab = "active";
    this.propertiesTab = "";
    this.measurementsTab = "";
    this.actionsTab = "";
  }

  goToProperties() {
    this.categoriesTab = "";
    this.propertiesTab = "active";
    this.measurementsTab = "";
    this.actionsTab = "";
  }

  goToMeasurements() {
    this.categoriesTab = "";
    this.propertiesTab = "";
    this.measurementsTab = "active";
    this.actionsTab = "";
  }

  goToActions() {
    this.categoriesTab = "";
    this.propertiesTab = "";
    this.measurementsTab = "";
    this.actionsTab = "active";
  }

  async createProfile(name: string) {
    console.log("Will create new profile " + name);
    try {
      let profile = (
        await this.inventoryService.create({
          name: name,
          c8y_Global: {},
          type: "c8y_Software",
          softwareType: "tedge-profile",
        })
      ).data;
      console.log(profile);
      this.loadProfiles();
      this.currentProfile = profile;
      this.currentProfileVersion.id = profile.id;
      this.currentProfileVersion.name = name;
    } catch (e) {
      console.error(e);
      this.alertService.danger(`Couldn't create profile ${name}`, e.message);
    }
  }

  async copyProfile(name: string) {
    console.log("Will create new profile " + name);
    try {
      /*let profile = await this.sshService.createProfile(name);
      this.profiles.set(profile.id, profile);
      this.currentProfile = profile.id;*/
      await this.saveProfile();
    } catch (e) {
      console.error(e);
    }
  }

  async saveProfile() {
    console.log(this.currentProfileVersion);
    let newBinary = (
      await this.binaryService.create(
        new Blob([JSON.stringify(this.currentProfileVersion)], {
          type: "text/json",
        }),
        {
          name:
            this.currentProfileVersion.name +
            new Date().toISOString() +
            ".json",
        }
      )
    ).data;
    console.log(newBinary);
    if (this.currentProfileVersion.binaryId) {
      this.inventoryService.childAdditionsRemove(
        this.currentProfileVersion.binaryId,
        this.currentProfileVersion.id
      );
    }
    let addition = (
      await this.inventoryService.childAdditionsAdd(
        newBinary.id,
        this.currentProfileVersion.id
      )
    ).data;
    this.inventoryService.update({
      id: this.currentProfileVersion.id,
      c8y_Software: {
        version: this.currentProfileVersion.version + "::tedge-profile",
        url: newBinary.self.replace("managedObjects", "binaries"),
      },
    });
    this.currentProfileVersion.binaryId = newBinary.id;
    //await this.loadProfiles();
  }

  async createProfileVersion(version: string) {
    console.log("Will create new version " + version);
    let newBinary = (
      await this.binaryService.create(
        new Blob([JSON.stringify(this.currentProfileVersion)], {
          type: "text/json",
        }),
        {
          name:
            this.currentProfileVersion.name +
            new Date().toISOString() +
            ".json",
        }
      )
    ).data;
    let versionAddition = (
      await this.inventoryService.create({
        c8y_Global: {},
        type: "c8y_SoftwareBinary",
        c8y_Software: {
          version: version + "::tedge-profile",
          url: newBinary.self.replace("managedObjects", "binaries"),
        },
      })
    ).data;
    await this.inventoryService.childAdditionsAdd(
      newBinary.id,
      versionAddition.id
    );
    console.log(versionAddition);
    await this.inventoryService.childAdditionsAdd(
      versionAddition.id,
      this.currentProfile.id
    );
    this.currentProfileVersion.binaryId = newBinary.id;
    this.currentProfileVersion.id = versionAddition.id;
    this.currentProfileVersion.version = version;
    this.currentProfile.childAdditions = (
      await this.inventoryService.detail(this.currentProfile)
    ).data.childAdditions;
    this.loadProfileVersions();
  }

  deleteCategory(category) {
    if (category.canDelete) {
      this.currentProfileVersion.categories.splice(
        this.currentProfileVersion.categories.indexOf(category),
        1
      );
    }
  }

  addCategory() {
    if (!this.currentProfileVersion.categories) {
      this.currentProfileVersion.categories = new Array<Category>();
    }
    this.currentProfileVersion.categories.push(new Property());
  }

  deleteProperty(property) {
    if (property.canDelete) {
      this.currentProfileVersion.properties.splice(
        this.currentProfileVersion.properties.indexOf(property),
        1
      );
    }
  }

  addProperty() {
    if (!this.currentProfileVersion.properties) {
      this.currentProfileVersion.properties = new Array<Property>();
    }
    this.currentProfileVersion.properties.push(new Property());
  }

  deleteOperation(operation) {
    this.currentProfileVersion.actions?.splice(
      this.currentProfileVersion.actions?.indexOf(operation),
      1
    );
  }

  addOperation() {
    if (!this.currentProfileVersion.actions) {
      this.currentProfileVersion.actions = new Array<DeviceOperation>();
    }
    this.currentProfileVersion.actions.push(new DeviceOperation());
  }

  deleteElement(operation: DeviceOperation, element: DeviceOperationElement) {
    operation.elements.splice(operation.elements.indexOf(element), 1);
  }

  moveUp(operation: DeviceOperation, element: DeviceOperationElement) {
    let index = operation.elements.indexOf(element);
    if (index > 0) {
      let el = operation.elements[index];
      operation.elements[index] = operation.elements[index - 1];
      operation.elements[index - 1] = el;
    }
  }

  moveDown(operation: DeviceOperation, element: DeviceOperationElement) {
    let index = operation.elements.indexOf(element);
    if (index !== -1 && index < operation.elements.length - 1) {
      let el = operation.elements[index];
      operation.elements[index] = operation.elements[index + 1];
      operation.elements[index + 1] = el;
    }
  }

  addParam(operation: DeviceOperation) {
    operation.elements.push(new DeviceOperationElement());
  }

  addGroup(operation: DeviceOperation) {
    let element: DeviceOperationElement = new DeviceOperationElement();
    element.type = ParamType.GROUP;
    operation.elements.push(element);
  }

  addValue(param: DeviceOperationElement) {
    if (!param.values) {
      param.values = [];
    }
    param.values.push("");
    console.log(param.values);
  }

  deleteValue(param: DeviceOperationElement, value: string) {
    param.values.splice(param.values.indexOf(value), 1);
    console.log(param.values);
  }

  trackByIdx(index: number, obj: any): any {
    return index;
  }

  isParam(element: DeviceOperationElement): boolean {
    return !element.type || element.type != ParamType.GROUP;
  }

  isGroup(element: DeviceOperationElement): boolean {
    return element.type && element.type == ParamType.GROUP;
  }
}
