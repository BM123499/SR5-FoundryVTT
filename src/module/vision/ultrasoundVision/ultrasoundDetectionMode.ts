import { sourcePerceptionState, targetActor } from '../detectionModeHelpers';

export default class UltrasoundDetectionMode extends foundry.canvas.perception.DetectionMode {
    override _canDetect(
        ...[visionSource, target]: Parameters<foundry.canvas.perception.DetectionMode['_canDetect']>
    ): boolean {
        const sourceState = sourcePerceptionState(visionSource);
        if (sourceState.isAstral) return false;

        const actor = targetActor(target);
        if (!actor) return false;

        // Ultrasound detects physical shapes only.
        return actor.hasPhysicalBody;
    }
}
