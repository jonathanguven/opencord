import { useState } from "react";

interface UseLocalStorageStateOptions<Value> {
  deserialize?: (storedValue: string) => Value;
  serialize?: (value: Value) => string;
}

export function useLocalStorageState<Value>(
  key: string,
  initialValue: Value,
  options?: UseLocalStorageStateOptions<Value>
) {
  const deserialize =
    options?.deserialize ?? ((storedValue: string) => storedValue as Value);
  const serialize = options?.serialize ?? ((value: Value) => String(value));
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    const storedValue = window.localStorage.getItem(key);

    if (storedValue === null) {
      return initialValue;
    }

    try {
      return deserialize(storedValue);
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = (nextValue: Value) => {
    setValue(nextValue);

    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(key, serialize(nextValue));
  };

  return [value, setStoredValue] as const;
}
