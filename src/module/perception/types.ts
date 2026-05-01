export const PERCEPTION_MODES = ['physical', 'astral_perception', 'astral_projection'] as const;
export type PerceptionMode = typeof PERCEPTION_MODES[number];

export const TOKEN_PERCEPTION_MODE_OVERRIDES = ['inherit', ...PERCEPTION_MODES] as const;
export type TokenPerceptionModeOverride = typeof TOKEN_PERCEPTION_MODE_OVERRIDES[number];

export const TOKEN_AR_OVERRIDES = ['inherit', 'enabled', 'disabled'] as const;
export type TokenAROverride = typeof TOKEN_AR_OVERRIDES[number];

export const TOKEN_ASTRAL_VISIBILITY_TYPES = ['normal', 'astral_visible', 'dual_natured'] as const;
export type TokenAstralVisibilityType = typeof TOKEN_ASTRAL_VISIBILITY_TYPES[number];

export const VISIBILITY_TYPES = ['physical', 'astral', 'ar'] as const;
export type VisibilityType = typeof VISIBILITY_TYPES[number];

export const WALL_PRESETS = ['none', 'physicalBarrier', 'manaBarrier'] as const;
export type WallPreset = typeof WALL_PRESETS[number];

export const WALL_RESTRICTIONS = ['none', 'physical', 'astral', 'astral_physical'] as const;
export type WallRestriction = typeof WALL_RESTRICTIONS[number];

export const WALL_RESTRICTION_CHANNELS = ['move', 'sight', 'light', 'sound'] as const;
export type WallRestrictionChannel = typeof WALL_RESTRICTION_CHANNELS[number];

export const WALL_SENSE_RESTRICTION_CHANNELS = ['sight', 'light', 'sound'] as const;
export type WallSenseRestrictionChannel = typeof WALL_SENSE_RESTRICTION_CHANNELS[number];

export type TokenPerceptionState = {
    mode: PerceptionMode;
    arEnabled: boolean;
    isAstral: boolean;
    isAstralPerceiving: boolean;
    isProjecting: boolean;
};

export type ViewerPerceptionContext = {
    hasAstral: boolean;
    hasAR: boolean;
    sourceCount: number;
};
