import { immut, newVal } from "@cyftec/immutjs";
import type { MaybeSignal, Signal, SignalSubscriber } from "./types";

let subscriber: SignalSubscriber = null;

export const signal = <T>(value: T): Signal<T> => {
  let _value = immut(value);
  const subscriptions = new Set<SignalSubscriber>();

  return {
    type: "signal",
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

export const wire = <T>(destination: Signal<T>, ...sources: Signal<T>[]) =>
  sources.forEach((source) => effect(() => (destination.value = source.value)));

export const derived = <T>(
  signalValueGetter: (oldValue: T | null) => T
): Signal<T> => {
  let oldValue: T | null = null;
  const derivedSignal = signal<T>(oldValue as T);
  effect(() => {
    oldValue = signalValueGetter(oldValue);
    derivedSignal.value = oldValue;
  });

  return derivedSignal;
};

export const destr = (
  strings: TemplateStringsArray,
  ...signalExpressions: (
    | (() => string)
    | Signal<string | undefined>
    | undefined
  )[]
): Signal<string> =>
  derived(() => {
    return strings.reduce((acc, fragment, i) => {
      let expValue: string | null;
      const expression = signalExpressions[i];

      if (expression === undefined) {
        expValue = "";
      } else if (typeof expression === "function") {
        expValue = expression();
      } else if (valueIsSignal(expression)) {
        expValue = expression.value || "";
      } else {
        expValue = null;
      }

      if (expValue === null)
        throw new Error(
          "Expected a signal or a function expression which contains signal values and returns a string"
        );

      return `${acc}${fragment}${expValue}`;
    }, "");
  });

export const valueIsSignal = (value: MaybeSignal<any>): boolean =>
  !!(value?.type === "signal");
