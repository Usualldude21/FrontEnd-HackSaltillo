import { createContext, useContext } from "react";
import type { SentinelDataSource } from "../domain/ports";

export const DataSourceContext = createContext<SentinelDataSource | null>(null);

export function useDataSource(): SentinelDataSource {
  const value = useContext(DataSourceContext);
  if (value === null) throw new Error("DataSourceContext no está configurado.");
  return value;
}
