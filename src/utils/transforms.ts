import { isPlainObject } from "@cyftec/immutjs";
import { derived, source, valueIsSignal } from "../core";
import type { DerivedSignal, MaybeSignal, Signal } from "../types";

/**
 * SHorthand method to get value of a maybesignal
 * @param value
 * @returns
 */
export const val = <T>(value: MaybeSignal<T>): T =>
  valueIsSignal(value) ? (value as Signal<T>).value : (value as T);

/**
 * Tuple of truthy and falsy derived signals
 * @param boolGetterFn
 * @returns
 */
export const dbools = (
  boolGetterFn: () => boolean
): [DerivedSignal<boolean>, DerivedSignal<boolean>] => {
  const truthy = derived(boolGetterFn);
  const falsy = derived(() => !truthy.value);

  return [truthy, falsy];
};

/**
 * Derived String Signal
 * @param strings
 * @param tlExpressions
 * @returns
 */

export type TemplateLiteralExpressions = ((() => any) | Signal<any> | any)[];

export const dstr = (
  strings: TemplateStringsArray,
  ...tlExpressions: TemplateLiteralExpressions
): DerivedSignal<string> =>
  derived(() => {
    return strings.reduce((acc, fragment, i) => {
      let expValue;
      const expression = tlExpressions[i];

      if (typeof expression === "function") {
        expValue = expression() ?? "";
      } else if (valueIsSignal(expression)) {
        expValue = (expression as Signal<any>).value ?? "";
      } else {
        expValue = (expression as any) ?? "";
      }

      return `${acc}${fragment}${expValue.toString()}`;
    }, "");
  });

/**
 * Derived object with all of its properties are derived signals
 * @param objSignal
 * @returns
 */
export const dprops = <T extends object>(
  objSignal: Signal<T>
): { [key in keyof T]: DerivedSignal<T[key]> } => {
  if (!valueIsSignal(objSignal) || !isPlainObject(objSignal.value))
    throw new Error("Thee argument should be signal of a plain object");

  const signalledPropsObj = Object.keys(objSignal.value).reduce((map, k) => {
    const key = k as keyof T;
    map[key] = derived(() => objSignal.value[key]);
    return map;
  }, {} as { [key in keyof T]: DerivedSignal<T[key]> });

  return signalledPropsObj;
};

/**
 * Derived Signals of Promise State
 * @param promiseFn
 * @param runImmediately
 * @param ultimately
 * @returns
 */
type PromResult<T> = T | undefined;
type PromError = Error | undefined;
type PromRunningState = boolean;
type RunPromFn = () => void;

export const dpromstate = <T>(
  promiseFn: () => Promise<T>,
  runImmediately: boolean = true,
  ultimately?: () => void
): [
  DerivedSignal<PromResult<T>>,
  DerivedSignal<PromError>,
  RunPromFn,
  DerivedSignal<PromRunningState>
] => {
  type PromState = {
    isRunning: PromRunningState;
    result: PromResult<T>;
    error: PromError;
  };
  const state = source<PromState>({
    isRunning: runImmediately,
    result: undefined,
    error: undefined,
  });

  const runPromise: RunPromFn = () =>
    promiseFn()
      .then((res) => {
        state.value = {
          isRunning: false,
          result: res,
          error: undefined,
        };
      })
      .catch((e) => {
        const prevResult = state.value.result;
        /**
         * result.value is not set to undefined because, if the promise
         * is run multiple times, ideally last result.value should not be
         * overriden due to current error.
         *
         * Best Practise: Always check error first while using this method.
         * Explanation: There's a chance that promiseFn errors out when run
         * at nth time. In that case, the result of (n-1)th time is still intact
         * and not overriden. While error has some value due to promise failure
         * at the nth time.
         *
         * Notice in catch block that error.value is always reset whenever
         * there is a success. There is no point of preserving the error
         * of the last run.
         */
        state.value = {
          isRunning: false,
          result: prevResult,
          error: e,
        };
      })
      .finally(ultimately);

  if (runImmediately) runPromise();

  const { isRunning, result, error } = dprops(state);
  return [result, error, runPromise, isRunning];
};
