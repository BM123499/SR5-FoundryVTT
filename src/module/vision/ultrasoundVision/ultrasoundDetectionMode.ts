import { physicalBarrierLineOfSightClear, sourcePerceptionState, targetActor } from '../detectionModeHelpers';

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

    override _testLOS(
        ...args: Parameters<foundry.canvas.perception.DetectionMode['_testLOS']>
    ): boolean {
        const [visionSource, mode, target, test] = args;
        if (!super._testLOS(visionSource, mode, target, test)) return false;
        return physicalBarrierLineOfSightClear(visionSource, test);
    }
}
