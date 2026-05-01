import ThermographicVisionFilter from './thermographicFilter';
import { sourcePerceptionState, targetActor } from '../detectionModeHelpers';

export default class ThermographicVisionDetectionMode extends foundry.canvas.perception.DetectionMode {
    static override getDetectionFilter() {
        return (this._detectionFilter ??= ThermographicVisionFilter.create());
    }
  
    override _canDetect(
        ...[visionSource, target]: Parameters<foundry.canvas.perception.DetectionMode['_canDetect']>
    ) {
        const sourceState = sourcePerceptionState(visionSource);
        if (sourceState.isProjecting) return false;

        const actor = targetActor(target);
        return !!actor?.system.visibilityChecks.meat.hasHeat;
    }
}
  
