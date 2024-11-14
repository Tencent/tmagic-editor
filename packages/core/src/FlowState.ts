export default class FlowState {
  public isAbort: boolean;
  constructor() {
    this.isAbort = false;
  }
  public abort() {
    this.isAbort = true;
  }
  public reset() {
    this.isAbort = false;
  }
}
