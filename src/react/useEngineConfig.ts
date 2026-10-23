import { useState, useEffect } from 'react';
import {
  getEngineConfig,
  updateEngineConfig,
  resetEngineConfig,
  subscribeEngineConfig,
  getConfigDiff,
  DEFAULT_ENGINE_CONFIG,
  type EngineConfig,
  type DeepPartial
} from '../core/config';

export function useEngineConfig() {
  const [config, setConfig] = useState<EngineConfig>(() => ({ ...getEngineConfig() }));

  useEffect(() => {
    return subscribeEngineConfig((newConfig) => {
      // Force React state update with cloned object
      setConfig({
        physics: { ...newConfig.physics },
        gaze: { ...newConfig.gaze },
        motion: { ...newConfig.motion },
        eyes: { ...newConfig.eyes },
        mesh: { ...newConfig.mesh }
      });
    });
  }, []);

  return {
    config,
    diff: getConfigDiff(config),
    defaults: DEFAULT_ENGINE_CONFIG,
    updateConfig: updateEngineConfig,
    resetConfig: resetEngineConfig
  };
}
