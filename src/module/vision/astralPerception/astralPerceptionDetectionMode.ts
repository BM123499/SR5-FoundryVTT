
import AstralVisionFilter from './astralPerceptionFilter';
import { sourcePerceptionState, targetActor } from '../detectionModeHelpers';

export default class AstralPerceptionDetectionMode extends foundry.canvas.perception.DetectionMode {
    static override getDetectionFilter() {
        return (this._detectionFilter ??= AstralVisionFilter.create());
    }

    override _canDetect(
        ...[visionSource, target]: Parameters<foundry.canvas.perception.DetectionMode['_canDetect']>
    ) {
        const sourceState = sourcePerceptionState(visionSource);
        if (!sourceState.isAstral) return false;

        const actor = targetActor(target);
        if (!actor) return false;

        // Astral perception/projection should continue to see normal physical content.
        if (actor.hasPhysicalBody) return true;

        const targetAstralChecks = actor.system.visibilityChecks.astral;
        return !!(targetAstralChecks?.hasAura || targetAstralChecks?.astralActive || targetAstralChecks?.affectedBySpell);
    }
}
  
