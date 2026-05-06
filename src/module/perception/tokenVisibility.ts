import type { TokenAstralVisibilityType } from './types';
import {
    getTokenAstralVisibilityType,
    isTokenAstralVisibilityTypeVisibleForState,
    isVisionSourceCompatibleWithTokenAstralVisibilityType,
    resolveTokenPerceptionState,
    resolveVisionSourcePerceptionState
} from './perceptionState';
import AstralProjectionVisionFilter from '@/module/vision/astralProjection/astralProjectionFilter';

type AstralAuraStyle = 'none' | 'projectionPhysicalAura' | 'astralPerceptionGlow';

let projectionPhysicalAuraFilter: PIXI.Filter | null = null;
let astralPerceptionGlowFilter: PIXI.Filter | null = null;

const getProjectionPhysicalAuraFilter = (): PIXI.Filter => {
    projectionPhysicalAuraFilter ??= AstralProjectionVisionFilter.create();
    const uniforms = projectionPhysicalAuraFilter.uniforms as Record<string, unknown>;
    uniforms.auraStrength = 0.82;
    uniforms.auraTintA = [0.95, 0.84, 0.45];
    uniforms.auraTintB = [1.0, 0.96, 0.78];
    uniforms.pulsarEnabled = 1.0;
    uniforms.pulseSpeed = 3.4;
    uniforms.pulseDepth = 0.35;
    return projectionPhysicalAuraFilter;
};

const getAstralPerceptionGlowFilter = (): PIXI.Filter => {
    astralPerceptionGlowFilter ??= AstralProjectionVisionFilter.create();
    const uniforms = astralPerceptionGlowFilter.uniforms as Record<string, unknown>;
    uniforms.auraStrength = 0.58;
    uniforms.auraTintA = [0.54, 0.58, 1.0];
    uniforms.auraTintB = [0.82, 0.95, 1.0];
    uniforms.pulsarEnabled = 0.0;
    uniforms.pulseSpeed = 0.0;
    uniforms.pulseDepth = 0.0;
    return astralPerceptionGlowFilter;
};

const createVisibilityTestConfig = (
    token: Token,
    tolerance: number
): any => {
    const visibility = canvas.visibility as any & {
        _createVisibilityTestConfig?: (
            point: any,
            options: { tolerance: number; object: Token; }
        ) => any;
    };

    if (typeof visibility._createVisibilityTestConfig === 'function') {
        return visibility._createVisibilityTestConfig(token.center, { tolerance, object: token });
    }

    return {
        object: token,
        tests: [{
            point: {
                x: token.center.x,
                y: token.center.y,
                elevation: token.document.elevation
            },
            los: new Map()
        }]
    };
};

const getCompatibleVisionSources = (
    token: Token,
    visibilityType: TokenAstralVisibilityType
): foundry.canvas.sources.PointVisionSource.Internal.Any[] => {
    const sceneRect = canvas.dimensions?.sceneRect;
    if (!sceneRect) return [];

    const inBuffer = !sceneRect.contains(token.center.x, token.center.y);
    const visionSources = canvas.effects?.visionSources;
    if (!visionSources) return [];

    const activeVisionSources = visionSources.filter(source => source.active
        && (inBuffer !== sceneRect.contains(source.x, source.y)));

    return activeVisionSources.filter(source => isVisionSourceCompatibleWithTokenAstralVisibilityType(source, visibilityType));
};

const isLightSourceCompatible = (
    lightSource: any,
    visibilityType: TokenAstralVisibilityType
): boolean => {
    // Astral-only token visibility is not granted by light-based vision.
    if (visibilityType === 'astral_visible') return false;

    const sourceObject = lightSource.object;
    if (!(sourceObject instanceof Token)) return true;

    const sourceState = resolveTokenPerceptionState(sourceObject.document);
    return isTokenAstralVisibilityTypeVisibleForState(visibilityType, sourceState);
};

const resolveAstralAuraStyle = (
    visibilityType: TokenAstralVisibilityType,
    compatibleVisionSources: foundry.canvas.sources.PointVisionSource.Internal.Any[]
): AstralAuraStyle => {
    const isProjecting = compatibleVisionSources.some(source => resolveVisionSourcePerceptionState(source).isProjecting);
    const isAstralPerceiving = compatibleVisionSources.some(source => resolveVisionSourcePerceptionState(source).isAstralPerceiving);

    if (visibilityType === 'astral_visible') {
        if (isProjecting) return 'none';
        if (isAstralPerceiving) return 'astralPerceptionGlow';
        return 'none';
    }

    if ((visibilityType === 'normal' || visibilityType === 'dual_natured') && isProjecting) {
        return 'projectionPhysicalAura';
    }

    return 'none';
};

const applyAuraStyleIfNeeded = (
    token: Token,
    auraStyle: AstralAuraStyle
): void => {
    if (auraStyle === 'projectionPhysicalAura') {
        token.detectionFilter = getProjectionPhysicalAuraFilter();
        return;
    }

    if (auraStyle === 'astralPerceptionGlow') {
        token.detectionFilter = getAstralPerceptionGlowFilter();
    }
};

export const testTokenVisibilityWithPerception = (token: Token, tolerance: number): boolean => {
    if (!canvas?.ready) return false;

    const visionSources = canvas.effects?.visionSources;
    if (!visionSources?.some(source => source.active)) {
        return !!game.user?.isGM;
    }

    const visibilityType = getTokenAstralVisibilityType(token.document);
    const compatibleVisionSources = getCompatibleVisionSources(token, visibilityType);
    if (!compatibleVisionSources.length) return false;

    const config = createVisibilityTestConfig(token, tolerance);
    const detectionModes = CONFIG.Canvas.detectionModes as unknown as Record<string, foundry.canvas.perception.DetectionMode>;
    const auraStyle = resolveAstralAuraStyle(visibilityType, compatibleVisionSources);

    if (visibilityType !== 'astral_visible') {
        for (const lightSource of (canvas.effects?.lightSources ?? [])) {
            const source = lightSource as any;
            if (!source.data?.vision || !source.active) continue;
            if (!isLightSourceCompatible(source, visibilityType)) continue;

            const result = source.testVisibility(config);
            if (result === true) {
                applyAuraStyleIfNeeded(token, auraStyle);
                return true;
            }
        }
    }

    for (const visionSource of compatibleVisionSources) {
        if (visionSource.isBlinded) continue;

        const sourceToken = visionSource.object instanceof Token ? visionSource.object : null;
        const sourceTokenDocument = sourceToken?.document;
        const basicMode = sourceTokenDocument?.detectionModes.find(mode => mode.id === 'basicSight');
        if (basicMode) {
            const result = detectionModes.basicSight?.testVisibility(visionSource, basicMode, config);
            if (result === true) {
                applyAuraStyleIfNeeded(token, auraStyle);
                return true;
            }
        }

        const lightMode = sourceTokenDocument?.detectionModes.find(mode => mode.id === 'lightPerception');
        if (lightMode) {
            const result = detectionModes.lightPerception?.testVisibility(visionSource, lightMode, config);
            if (result === true) {
                applyAuraStyleIfNeeded(token, auraStyle);
                return true;
            }
        }
    }

    for (const visionSource of compatibleVisionSources) {
        const sourceToken = visionSource.object instanceof Token ? visionSource.object : null;
        const sourceTokenDocument = sourceToken?.document;
        if (!sourceTokenDocument) continue;

        for (const mode of sourceTokenDocument.detectionModes) {
            if ((mode.id === 'basicSight') || (mode.id === 'lightPerception')) continue;
            if (typeof mode.id !== 'string') continue;

            const detectionMode = detectionModes[mode.id];
            const result = detectionMode?.testVisibility(visionSource, mode, config);
            if (result === true) {
                if (auraStyle === 'none') {
                    token.detectionFilter = (detectionMode.constructor as any).getDetectionFilter();
                } else {
                    applyAuraStyleIfNeeded(token, auraStyle);
                }
                return true;
            }
        }
    }

    return false;
};
