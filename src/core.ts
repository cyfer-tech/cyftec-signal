import { immut, newVal } from "@cyftec/immutjs";
import type {
  DerivedSignal,
  MaybeSignal,
  SignalSubscriber,
  SourceSignal,
} from "./types";

let subscriber: SignalSubscriber = null;

export const source = <T>(value: T): SourceSignal<T> => {
  let _value = immut(value);
  const subscriptions = new Set<SignalSubscriber>();

  return {
    type: "source-signal",
    get value() {
      if (subscriber) subscriptions.add(subscriber);
      return newVal(_value);
    },
    set value(newValue: T) {
      if (newValue === _value) return;
      _value = immut(newValue);
      subscriptions.forEach((callback) => callback && callback());
    },
  };
};

export const effect = (fn: () => void): void => {
  subscriber = fn;
  fn();
  subscriber = null;
};

export const derived = <T>(
  signalValueGetter: (oldValue: T | undefined) => T
): DerivedSignal<T> => {
  let oldValue: T | undefined;
  const derivedSource = source<T>(oldValue as T);
  effect(() => {
    oldValue = signalValueGetter(oldValue);
    derivedSource.value = oldValue;
  });

  const derivedSignal: DerivedSignal<T> = {
    type: "derived-signal",
    get prevValue() {
      return oldValue;
    },
    get value() {
      return derivedSource.value;
    },
  };

  return derivedSignal;
};

export const valueIsSourceSignal = (value: MaybeSignal<any>): boolean =>
  !!(value?.type === "source-signal");

export const valueIsDerivedSignal = (value: MaybeSignal<any>): boolean =>
  !!(value?.type === "derived-signal");

export const valueIsSignal = (value: MaybeSignal<any>): boolean =>
  ["source-signal", "derived-signal"].includes(value?.type);
