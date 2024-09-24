import { effect, signal, type Signal } from "../index.ts";

let sigValue = "nothing";
const strSignal: Signal<string> = signal(sigValue);
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
