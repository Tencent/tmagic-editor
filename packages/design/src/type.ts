export interface CascaderOption {
  /** 指定选项的值为选项对象的某个属性值 */
  value: any;
  /** 指定选项标签为选项对象的某个属性值 */
  label: string;
  /** 指定选项的子选项为选项对象的某个属性值 */
  children?: CascaderOption[];
}

export interface TMagicMessage {
  success: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
  error: (msg: string) => void;
  closeAll: () => void;
}

export type ElMessageBoxShortcutMethod = ((
  message: string,
  title: string,
  options?: any,
  appContext?: any | null,
) => Promise<any>) &
  ((message: string, options?: any, appContext?: any | null) => Promise<any>);

export interface TMagicMessageBox {
  alert: ElMessageBoxShortcutMethod;

  confirm: ElMessageBoxShortcutMethod;

  prompt: ElMessageBoxShortcutMethod;

  close(): void;
}

export interface PluginOptions {
  message?: TMagicMessage;
  messageBox?: TMagicMessageBox;
  components?: Record<string, any>;
  [key: string]: any;
}
