export type BubbleInstance = {
  publishState: (key: string, value: any) => void;
  data: any;
  canvas: HTMLElement;
};

export type BubbleContext = {
  async: (fn: (callback: (err: any, result?: any) => void) => void) => void;
};

export type BubbleProperties = {
  [key: string]: any;
};