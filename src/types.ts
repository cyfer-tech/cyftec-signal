export type Signal<T> = {
  type: "signal";
  value: T;
};

export type MaybeSignal<T> = T | Signal<T>;

export type Signalify<T = {}> = {
  [K in keyof T]: T[K] extends Signal<any> ? T[K] : Signal<T[K]>;
};

export type DeSignalify<T = {}> = {
  [K in keyof T]: T[K] extends Signal<infer R> ? R : T[K];
};

export type SignalSubscriber = (() => void) | null;
