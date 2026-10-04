import { MODULES } from "./constants";
import type { ModuleConfig } from "./types";

export const getModuleConfig = (table: string): ModuleConfig | undefined =>
  MODULES.find((m) => m.table === table);
