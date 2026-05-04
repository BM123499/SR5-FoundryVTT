
import AstralProjectionVisionFilter from './astralProjectionFilter';

export default class AstralProjectionDetectionMode extends foundry.canvas.perception.DetectionMode {
    static override getDetectionFilter() {
        return (this._detectionFilter ??= AstralProjectionVisionFilter.create());
    }

    override _canDetect(
        ..._args: Parameters<foundry.canvas.perception.DetectionMode['_canDetect']>
    ): boolean {
        // Astral projection is handled as an overlay layer, not as a detection mode.
        return false;
    }
}
  
