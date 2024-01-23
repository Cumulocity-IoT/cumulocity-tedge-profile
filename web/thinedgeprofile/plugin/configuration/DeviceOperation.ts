import { DeviceOperationElement } from "./DeviceOperationElement";

export class DeviceOperation {
  id: string;
  name: string;
  categories: string[];
  property: string;
  elements: Array<DeviceOperationElement> = new Array<DeviceOperationElement>();
  tableRowAction: boolean;
  confirmation: boolean;
  tableName: string;
  icon: string;
  script: string;
}
