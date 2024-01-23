export class Property {
  name: string;
  label: string;
  categories: string[];
  description: string;
  script: string;
  canDelete: boolean = true;
  store: boolean = true;
  json: boolean = false;
}
