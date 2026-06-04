import { invoke } from "@tauri-apps/api/core";
import type { AppConfig } from "../types";

/**
 * 获取应用配置
 */
export async function getConfig(): Promise<AppConfig> {
  try {
    const config = await invoke<AppConfig>("get_config");
    return config;
  } catch (error) {
    console.error("Failed to get config:", error);
    throw error;
  }
}

/**
 * 保存应用配置
 */
export async function saveConfig(config: AppConfig): Promise<void> {
  try {
    await invoke("save_config", { config });
  } catch (error) {
    console.error("Failed to save config:", error);
    throw error;
  }
}

/**
 * 恢复默认配置
 */
export async function resetConfig(): Promise<AppConfig> {
  try {
    const config = await invoke<AppConfig>("reset_config");
    return config;
  } catch (error) {
    console.error("Failed to reset config:", error);
    throw error;
  }
}
