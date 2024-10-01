"use client";

import { FhevmProvider } from "./fhevm-context";

export const FHEWrapper = ({ children }) => {
  return <FhevmProvider>{children}</FhevmProvider>;
};
