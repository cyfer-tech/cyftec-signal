import { effect, source, type SourceSignal } from "../index.ts";

let sigValue = "nothing";
const strSignal: SourceSignal<string> = source(sigValue);
let signalChangeCounter = 0;

effect(() => {
  // @ts-ignore
  console.log(
    `Test${++signalChangeCounter}: ${
      strSignal.value === sigValue ? "Pass" : "Failed"
    }`
  );
});

sigValue = "something";
strSignal.value = sigValue;
sigValue = "something else";
strSignal.value = sigValue;
