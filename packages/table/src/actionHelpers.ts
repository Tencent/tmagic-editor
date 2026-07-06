export const display = (fuc: boolean | Function | undefined, row: any) => {
  if (typeof fuc === 'function') {
    return fuc(row);
  }
  if (typeof fuc === 'boolean') {
    return fuc;
  }
  return true;
};

export const disabled = (fuc: boolean | Function | undefined, row: any) => {
  if (typeof fuc === 'function') {
    return fuc(row);
  }
  if (typeof fuc === 'boolean') {
    return fuc;
  }
  return false;
};

export const formatActionText = (fuc: string | Function | undefined, row: any) => {
  if (typeof fuc === 'function') {
    return fuc(row);
  }
  return fuc;
};
