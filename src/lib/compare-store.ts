import { useEffect, useState } from "react";

const KEY = "cpr_compare_ids";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("compare:change"));
}

export function addToCompare(id: string) {
  const list = read();
  if (list.includes(id)) return;
  if (list.length >= 4) list.shift();
  list.push(id);
  window.localStorage.setItem(KEY, JSON.stringify(list));
  emit();
}

export function removeFromCompare(id: string) {
  const list = read().filter((x) => x !== id);
  window.localStorage.setItem(KEY, JSON.stringify(list));
  emit();
}

export function clearCompare() {
  window.localStorage.removeItem(KEY);
  emit();
}

export function useCompare(): string[] {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    setList(read());
    const fn = () => setList(read());
    window.addEventListener("compare:change", fn);
    window.addEventListener("storage", fn);
    return () => {
      window.removeEventListener("compare:change", fn);
      window.removeEventListener("storage", fn);
    };
  }, []);
  return list;
}
