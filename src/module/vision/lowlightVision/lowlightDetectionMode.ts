
import LowLightVisionFilter from './lowlightFilter';

//todo: v10 foundry-vtt-types 
//@ts-expect-error
export default class LowlightVisionDetectionMode extends DetectionMode {

  //@ts-expect-error
  static override getDetectionFilter() {
    //@ts-expect-error
    return (this._detectionFilter ??= LowLightVisionFilter.create());
  }

  
    //@ts-expect-error
    override _canDetect(visionSource, target) {
      const tgt = target?.document;
      const targetIsVisible =
        tgt instanceof TokenDocument
        && !tgt.actor?.system.visibilityChecks.meat.hidden;


      return targetIsVisible

    }
  }
  