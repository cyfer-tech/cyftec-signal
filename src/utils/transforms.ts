import { isPlainObject } from "@cyftec/immutjs";
import { derived, valueIsSignal } from "../core";
import type { Signal } from "../types";

export const drstr = (
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
