export * from '@tmagic/form-schema';

export interface ValidateError {
  message: string;
  field: string;
}

export interface ChangeRecord {
  propPath?: string;
  value: any;
}

export interface ContainerChangeEventData {
  modifyKey?: string;
  changeRecords?: ChangeRecord[];
}
