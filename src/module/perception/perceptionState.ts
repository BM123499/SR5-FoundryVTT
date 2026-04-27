import { FLAGS, SYSTEM_NAME } from '@/module/constants';
import type { SR5Actor } from '@/module/actor/SR5Actor';
import {
    PERCEPTION_MODES,
    TOKEN_ASTRAL_VISIBILITY_TYPES,
    TOKEN_AR_OVERRIDES,
    TOKEN_PERCEPTION_MODE_OVERRIDES,
    type PerceptionMode,
    type TokenAstralVisibilityType,
    type TokenAROverride,
    type TokenPerceptionModeOverride,
    type TokenPerceptionState,
    type ViewerPerceptionContext,
    type VisibilityType,
    VISIBILITY_TYPES
} from './types';

const ASTRAL_VISION_MODE_ID = 'astralPerception';
const BASIC_VISION_MODE_ID = 'basic';
export type PerceptionSyncUpdateOperation = TokenDocument.Database.UpdateOperation & { sr5PerceptionSync?: boolean };

const normalizeChoice = <T extends readonly string[]>(value: unknown, choices: T, fallback: T[number]): T[number] => {
    if (typeof value !== 'string') return fallback;
    return (choices as readonly string[]).includes(value) ? (value as T[number]) : fallback;
};

const getActorPerceptionMode = (actor: SR5Actor | null | undefined): PerceptionMode => {
    return normalizeChoice(actor?.system.perception?.mode, PERCEPTION_MODES, 'physical');
};

const getActorAREnabled = (actor: SR5Actor | null | undefined): boolean => {
    return !!actor?.system.perception?.arEnabled;
};

export const isAstralMode = (mode: PerceptionMode): boolean => mode !== 'physical';

export const resolveTokenPerceptionState = (
    tokenDocument: TokenDocument.Implementation | null | undefined
): TokenPerceptionState => {
    const actor = tokenDocument?.actor as SR5Actor | null | undefined;
    const actorMode = getActorPerceptionMode(actor);
    const actorAREnabled = getActorAREnabled(actor);

    const modeOverride = normalizeChoice(
        tokenDocument?.getFlag(SYSTEM_NAME, FLAGS.TokenPerceptionModeOverride),
        TOKEN_PERCEPTION_MODE_OVERRIDES,
        'inherit'
    ) as TokenPerceptionModeOverride;

    const arOverride = normalizeChoice(
        tokenDocument?.getFlag(SYSTEM_NAME, FLAGS.TokenPerceptionAROverride),
        TOKEN_AR_OVERRIDES,
        'inherit'
    ) as TokenAROverride;

    const mode = modeOverride === 'inherit' ? actorMode : modeOverride;
    const arEnabled = arOverride === 'inherit' ? actorAREnabled : arOverride === 'enabled';

    return {
        mode,
        arEnabled,
        isAstral: isAstralMode(mode),
        isAstralPerceiving: mode === 'astral_perception',
        isProjecting: mode === 'astral_projection',
    };
};

export const resolveVisionSourcePerceptionState = (
    visionSource: foundry.canvas.sources.PointVisionSource.Internal.Any | null | undefined
): TokenPerceptionState => {
    const token = visionSource?.object instanceof Token ? visionSource.object : null;
    return resolveTokenPerceptionState(token?.document);
};

export const normalizeTokenAstralVisibilityType = (
    visibilityType: unknown
): TokenAstralVisibilityType => {
    return normalizeChoice(visibilityType, TOKEN_ASTRAL_VISIBILITY_TYPES, 'normal');
};

export const getTokenAstralVisibilityType = (
    tokenDocument: TokenDocument.Implementation | null | undefined
): TokenAstralVisibilityType => {
    const flagValue = tokenDocument?.getFlag(SYSTEM_NAME, FLAGS.TokenAstralVisibilityType);
    return normalizeTokenAstralVisibilityType(flagValue);
};

export const isTokenAstralVisibilityTypeVisibleForState = (
    visibilityType: TokenAstralVisibilityType,
    state: TokenPerceptionState
): boolean => {
    if (visibilityType === 'normal') return !state.isProjecting;
    if (visibilityType === 'astral_visible') return state.isAstral;
    return true;
};

export const isVisionSourceCompatibleWithTokenAstralVisibilityType = (
    visionSource: foundry.canvas.sources.PointVisionSource.Internal.Any,
    visibilityType: TokenAstralVisibilityType
): boolean => {
    const state = resolveVisionSourcePerceptionState(visionSource);
    return isTokenAstralVisibilityTypeVisibleForState(visibilityType, state);
};

export const getOwnedActiveVisionSources = (): foundry.canvas.sources.PointVisionSource.Internal.Any[] => {
    if (!canvas?.ready) return [];
    const sources = canvas.effects?.visionSources;
    if (!sources) return [];

    return [...sources.values()].filter(source => {
        if (!source.active) return false;

        const token = source.object instanceof Token ? source.object : null;
        if (!token?.actor?.isOwner) return false;
        if (!token.document.sight.enabled) return false;

        return true;
    });
};

export const resolveViewerPerceptionContext = (): ViewerPerceptionContext => {
    if (game.user?.isGM) {
        return {
            hasAstral: true,
            hasAR: true,
            sourceCount: 0
        };
    }

    const sources = getOwnedActiveVisionSources();

    let hasAstral = false;
    let hasAR = false;

    for (const source of sources) {
        const state = resolveVisionSourcePerceptionState(source);
        hasAstral ||= state.isAstral;
        hasAR ||= state.arEnabled;
    }

    return {
        hasAstral,
        hasAR,
        sourceCount: sources.length
    };
};

export const normalizeVisibilityType = (visibilityType: unknown): VisibilityType => {
    return normalizeChoice(visibilityType, VISIBILITY_TYPES, 'default');
};

export const getDocumentVisibilityType = (
    document: TileDocument.Implementation | DrawingDocument.Implementation
): VisibilityType => {
    const flagValue = foundry.utils.getProperty(document, `flags.${SYSTEM_NAME}.${FLAGS.VisibilityType}`);
    return normalizeVisibilityType(flagValue);
};

export const isVisibilityTypeVisible = (
    visibilityType: VisibilityType,
    context: ViewerPerceptionContext = resolveViewerPerceptionContext()
): boolean => {
    if (visibilityType === 'default') return true;
    if (visibilityType === 'ar') return context.hasAR;
    if (visibilityType === 'astral') return context.hasAstral;
    return true;
};

export const isDocumentVisibleForViewer = (
    document: TileDocument.Implementation | DrawingDocument.Implementation
): boolean => {
    const visibilityType = getDocumentVisibilityType(document);
    return isVisibilityTypeVisible(visibilityType);
};

export const refreshPerception = (): void => {
    if (!canvas?.ready) return;

    canvas.perception.update({
        initializeVision: true,
        refreshVision: true,
        refreshVisionSources: true,
        refreshPrimary: true,
        refreshOcclusion: true
    });

    for (const tile of canvas.tiles?.placeables ?? []) {
        tile.renderFlags.set({ refreshState: true });
    }

    for (const drawing of canvas.drawings?.placeables ?? []) {
        drawing.renderFlags.set({ refreshState: true });
    }
};

export const syncTokenVisionMode = async (
    tokenDocument: TokenDocument.Implementation,
    updateOptions: PerceptionSyncUpdateOperation = {}
): Promise<void> => {
    const perceptionState = resolveTokenPerceptionState(tokenDocument);
    const currentVisionMode = tokenDocument.sight.visionMode ?? BASIC_VISION_MODE_ID;
    const previousVisionMode = tokenDocument.getFlag(SYSTEM_NAME, FLAGS.TokenPreviousVisionMode) as string | undefined;

    if (perceptionState.isProjecting) {
        if (currentVisionMode === ASTRAL_VISION_MODE_ID) return;

        const updates: TokenDocument.UpdateData = {
            sight: { visionMode: ASTRAL_VISION_MODE_ID },
            flags: {
                [SYSTEM_NAME]: {
                    [FLAGS.TokenPreviousVisionMode]: currentVisionMode
                }
            }
        };
        await tokenDocument.update(updates, updateOptions);
        return;
    }

    if (currentVisionMode !== ASTRAL_VISION_MODE_ID) return;

    const restoredVisionMode = previousVisionMode && previousVisionMode !== ASTRAL_VISION_MODE_ID
        ? previousVisionMode
        : BASIC_VISION_MODE_ID;

    await tokenDocument.update({ sight: { visionMode: restoredVisionMode } }, updateOptions);
};

export const syncActorTokenVisionModes = async (
    actor: SR5Actor,
    updateOptions: PerceptionSyncUpdateOperation = {}
): Promise<void> => {
    const activeTokens = actor.getActiveTokens(true) ?? [];
    await Promise.all(activeTokens.map(async token => await syncTokenVisionMode(token.document, updateOptions)));
};
