import LowLightVisionFilter from '../lowlightVision/lowlightFilter';
import { sourcePerceptionState, targetIsInvisible } from '../detectionModeHelpers';

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
}
