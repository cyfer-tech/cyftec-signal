import { effect } from "../core";
import type { Signal, SourceSignal } from "../types";

export const receive = <T>(
  receiver: SourceSignal<T>,
  ...transmittors: Signal<T>[]
) =>
  transmittors.forEach((transmittor) =>
    effect(() => (receiver.value = transmittor.value))
  );

export const transmit = <T>(
  transmittor: Signal<T>,
  ...receivers: SourceSignal<T>[]
) =>
  effect(() => {
    receivers.forEach((receiver) => (receiver.value = transmittor.value));
  });
