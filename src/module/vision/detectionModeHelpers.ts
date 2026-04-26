import type { SR5Actor } from '@/module/actor/SR5Actor';
import { resolveVisionSourcePerceptionState } from '@/module/perception/perceptionState';
import { isAstralLineBlocked, isPhysicalBarrierLineBlocked } from '@/module/perception/wallPerception';

const targetTokenDocument = (target: CanvasVisibility.TestObject | undefined): TokenDocument.Implementation | null => {
    if (!target) return null;
    return target.document instanceof TokenDocument ? target.document : null;
};

export const targetActor = (target: CanvasVisibility.TestObject | undefined): SR5Actor | null => {
    const tokenDocument = targetTokenDocument(target);
    return (tokenDocument?.actor as SR5Actor | undefined) ?? null;
};

export const targetIsInvisible = (target: CanvasVisibility.TestObject | undefined): boolean => {
    const actor = targetActor(target);
    return !!actor?.statuses.has(CONFIG.specialStatusEffects.INVISIBLE);
};

export const sourcePerceptionState = (
    visionSource: foundry.canvas.sources.PointVisionSource.Internal.Any
) => resolveVisionSourcePerceptionState(visionSource);

const toLine = (
    visionSource: foundry.canvas.sources.PointVisionSource.Internal.Any,
    test: CanvasVisibility.Test
) => ({
    origin: { x: visionSource.x, y: visionSource.y },
    destination: { x: test.point.x, y: test.point.y }
});

export const astralLineOfSightClear = (
    visionSource: foundry.canvas.sources.PointVisionSource.Internal.Any,
    test: CanvasVisibility.Test
): boolean => {
    const { origin, destination } = toLine(visionSource, test);
    return !isAstralLineBlocked(origin, destination);
};

export const physicalBarrierLineOfSightClear = (
    visionSource: foundry.canvas.sources.PointVisionSource.Internal.Any,
    test: CanvasVisibility.Test
): boolean => {
    const { origin, destination } = toLine(visionSource, test);
    return !isPhysicalBarrierLineBlocked(origin, destination);
};
