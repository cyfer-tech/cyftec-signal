import { effect } from "../core";
import type { Signal } from "../types";

export const receive = <T>(destination: Signal<T>, ...sources: Signal<T>[]) =>
  sources.forEach((source) => effect(() => (destination.value = source.value)));

export const transmit = <T>(source: Signal<T>, ...destinations: Signal<T>[]) =>
  effect(() => {
    destinations.forEach((destination) => (destination.value = source.value));
  });
