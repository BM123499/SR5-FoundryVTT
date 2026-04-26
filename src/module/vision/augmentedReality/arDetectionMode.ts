
//todo: v10 foundry-vtt-types 

import AugmentedRealityVisionFilter from "./arFilter";
import { sourcePerceptionState } from '../detectionModeHelpers';

export default class AugmentedRealityVisionDetectionMode extends foundry.canvas.perception.DetectionMode {

    static override getDetectionFilter() {
        return this._detectionFilter ??= AugmentedRealityVisionFilter.create();
    }
  
    override _canDetect(
        ...[visionSource, target]: Parameters<foundry.canvas.perception.DetectionMode['_canDetect']>
    ) {
        const tgt = target?.document instanceof TokenDocument ? target.document : null;
        const targetHasIcon = !!tgt?.actor?.system.visibilityChecks.matrix.hasIcon;

        const targetIsNotRunningSilent = !tgt?.actor?.system.visibilityChecks.matrix.runningSilent;
        const sourceState = sourcePerceptionState(visionSource);
        if (!sourceState.arEnabled) return false;

        return targetHasIcon && targetIsNotRunningSilent;
    }
}
  
