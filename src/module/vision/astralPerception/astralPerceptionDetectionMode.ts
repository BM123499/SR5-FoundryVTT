
import AstralVisionFilter from './astralPerceptionFilter';

export default class AstralPerceptionDetectionMode extends foundry.canvas.perception.DetectionMode {
    static override getDetectionFilter() {
        return (this._detectionFilter ??= AstralVisionFilter.create());
    }

    override _canDetect(
        ..._args: Parameters<foundry.canvas.perception.DetectionMode['_canDetect']>
    ): boolean {
        // Astral perception is handled as an overlay layer, not as a detection mode.
        return false;
    }
}
  
