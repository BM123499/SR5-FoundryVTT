
//todo: v10 foundry-vtt-types 

import LowLightVisionFilter from "./lowlightFilter";
import { sourcePerceptionState, targetIsInvisible } from "../detectionModeHelpers";

export default class LowlightVisionDetectionMode extends foundry.canvas.perception.DetectionMode {

    static override getDetectionFilter() {
        return this._detectionFilter ??= LowLightVisionFilter.create();
    }

    override _canDetect(
        ...[visionSource, target]: Parameters<foundry.canvas.perception.DetectionMode['_canDetect']>
    ) {
        const sourceState = sourcePerceptionState(visionSource);
        if (sourceState.isProjecting) return false;

        return !targetIsInvisible(target);
    }
}
  
