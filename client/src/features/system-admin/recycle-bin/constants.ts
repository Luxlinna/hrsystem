import type { ModuleConfig } from "./types";
import { CORE_MODULES } from "./moduleConfigsCore";
import { EXTENDED_MODULES } from "./moduleConfigsExtended";

// Business records that are soft-deleted (hidden from their module pages)
// land here. Ephemeral / config data (notifications, roles, infra tokens)
// is still hard-deleted and never shows up in the Recycle Bin.
export const MODULES: ModuleConfig[] = [...CORE_MODULES, ...EXTENDED_MODULES];
