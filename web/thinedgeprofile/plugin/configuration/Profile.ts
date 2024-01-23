import { Category } from "./Category";
import { DeviceOperation } from "./DeviceOperation";
import { Property } from "./Property";

export class Profile {
  id: string;
  binaryId: string;
  name: string;
  version: string;
  actions: Array<DeviceOperation> = new Array<DeviceOperation>();
  categories: Array<Category> = new Array<Category>();
  properties: Array<Property> = new Array<Property>();
}
