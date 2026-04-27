import ThermographicVisionFilter from './thermographicFilter';
import { physicalBarrierLineOfSightClear, sourcePerceptionState, targetActor } from '../detectionModeHelpers';

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

    override _testLOS(
        ...args: Parameters<foundry.canvas.perception.DetectionMode['_testLOS']>
    ): boolean {
        const [visionSource, mode, target, test] = args;
        if (!super._testLOS(visionSource, mode, target, test)) return false;
        return physicalBarrierLineOfSightClear(visionSource, test);
    }
}
  
