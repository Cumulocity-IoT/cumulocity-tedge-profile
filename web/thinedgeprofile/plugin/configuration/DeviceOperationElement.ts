export class DeviceOperationElement {
  id: string;
  name: string;
  type: ParamType;
  values: string[];
  repeatable: boolean = false;
  minOccur: number = 1;
  maxOccur: number = 1;
  dependsOnParam: boolean = false;
  dependsOnParamId: string;
  dependsOnParamValue: string;
  elements: Array<DeviceOperationElement> = new Array<DeviceOperationElement>();
}

export enum ParamType {
  STRING = "STRING",
  INTEGER = "INTEGER",
  FLOAT = "FLOAT",
  BOOL = "BOOL",
  DATE = "DATE",
  ENUM = "ENUM",
  GROUP = "GROUP",
  FILE = "FILE",
}
