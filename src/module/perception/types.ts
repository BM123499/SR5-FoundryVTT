export const PERCEPTION_MODES = ['physical', 'astral_perception', 'astral_projection'] as const;
export type PerceptionMode = typeof PERCEPTION_MODES[number];

export const TOKEN_PERCEPTION_MODE_OVERRIDES = ['inherit', ...PERCEPTION_MODES] as const;
export type TokenPerceptionModeOverride = typeof TOKEN_PERCEPTION_MODE_OVERRIDES[number];

export const TOKEN_AR_OVERRIDES = ['inherit', 'enabled', 'disabled'] as const;
export type TokenAROverride = typeof TOKEN_AR_OVERRIDES[number];

export const VISIBILITY_TYPES = ['default', 'astral', 'ar'] as const;
export type VisibilityType = typeof VISIBILITY_TYPES[number];

export const WALL_PRESETS = ['none', 'physicalBarrier', 'manaBarrier'] as const;
export type WallPreset = typeof WALL_PRESETS[number];

export type TokenPerceptionState = {
    mode: PerceptionMode;
    arEnabled: boolean;
    isAstral: boolean;
    isProjecting: boolean;
};

export type ViewerPerceptionContext = {
    hasAstral: boolean;
    hasAR: boolean;
    sourceCount: number;
};
