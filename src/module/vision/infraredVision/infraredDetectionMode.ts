import LowLightVisionFilter from '../lowlightVision/lowlightFilter';
import { physicalBarrierLineOfSightClear, sourcePerceptionState, targetIsInvisible } from '../detectionModeHelpers';

export default class InfraredVisionDetectionMode extends foundry.canvas.perception.DetectionMode {
    static override getDetectionFilter() {
        return this._detectionFilter ??= LowLightVisionFilter.create();
    }

    override _canDetect(
        ...[visionSource, target]: Parameters<foundry.canvas.perception.DetectionMode['_canDetect']>
    ): boolean {
        const sourceState = sourcePerceptionState(visionSource);
        if (sourceState.isProjecting) return false;

        // Infrared improves darkness visibility but does not reveal hidden targets.
        return !targetIsInvisible(target);
    }

    override _testLOS(
        ...args: Parameters<foundry.canvas.perception.DetectionMode['_testLOS']>
    ): boolean {
        const [visionSource, mode, target, test] = args;
        if (!super._testLOS(visionSource, mode, target, test)) return false;
        return physicalBarrierLineOfSightClear(visionSource, test);
    }
}
