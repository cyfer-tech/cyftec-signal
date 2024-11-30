import { isPlainObject } from "@cyftec/immutjs";
import { derived, signal, valueIsSignal } from "../core";
import type { Signal } from "../types";

/**
 * Derived String Signal
 * @param strings
 * @param signalExpressions
 * @returns
 */
export const drstr = (
  strings: TemplateStringsArray,
  ...signalExpressions: ((() => any) | Signal<string | undefined> | undefined)[]
): Signal<string> =>
  derived(() => {
    return strings.reduce((acc, fragment, i) => {
      let expValue: string | null;
      const expression = signalExpressions[i];

      if (expression === undefined) {
        expValue = "";
      } else if (typeof expression === "function") {
        expValue = (expression() ?? "").toString();
      } else if (valueIsSignal(expression)) {
        expValue = expression.value ?? "";
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

/**
 * Derived Signals of Object Spread Values
 * @param objSignal
 * @returns
 */
export const drspread = <T extends object>(
  objSignal: Signal<T>
): { [key in keyof T]: Signal<T[key]> } => {
  if (!valueIsSignal(objSignal) || !isPlainObject(objSignal.value))
    throw new Error("Thee argument should be signal of a plain object");

  const signalledEntries = Object.keys(objSignal.value).reduce((map, k) => {
    const key = k as keyof T;
    map[key] = derived(() => objSignal.value[key]);
    return map;
  }, {} as { [key in keyof T]: Signal<T[key]> });

  return signalledEntries;
};

/**
 * Derived Signals of Promise State
 * @param promiseFn
 * @param runImmediately
 * @param ultimately
 * @returns
 */
export const drpromstate = <T>(
  promiseFn: () => Promise<T>,
  runImmediately = true,
  ultimately?: () => void
) => {
  const isBusy: Signal<boolean> = signal(runImmediately);
  const result: Signal<T | undefined> = signal(undefined);
  const error: Signal<Error | undefined> = signal(undefined);

  const runPromise = () => {
    isBusy.value = true;

    promiseFn()
      .then((res) => {
        isBusy.value = false;
        result.value = res;
        error.value = undefined;
      })
      .catch((e) => {
        isBusy.value = false;
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
        error.value = e;
      })
      .finally(ultimately);
  };

  if (runImmediately) runPromise();

  return { isBusy, result, error, runPromise };
};
