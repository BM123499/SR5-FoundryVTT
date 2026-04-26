import AstralPerceptionDetectionMode from './astralPerception/astralPerceptionDetectionMode';
import AstralPerceptionBackgroundVisionShader  from './astralPerception/astralPerceptionBackgroundShader';
import ThermographicVisionDetectionMode from './thermographicVision/thermographicDetectionMode';
import LowlightVisionDetectionMode from './lowlightVision/lowlightDetectionMode';
import AugmentedRealityVisionDetectionMode from './augmentedReality/arDetectionMode';
import InfraredVisionDetectionMode from './infraredVision/infraredDetectionMode';
import UltrasoundDetectionMode from './ultrasoundVision/ultrasoundDetectionMode';
import { astralLineOfSightClear, sourcePerceptionState } from './detectionModeHelpers';

export default class VisionConfigurator {
    static configureAstralPerception() {
        CONFIG.Canvas.detectionModes.astralPerception = new AstralPerceptionDetectionMode({
            id: 'astralPerception',
            label: 'SR5.Vision.AstralPerception',
            type: foundry.canvas.perception.DetectionMode.DETECTION_TYPES.SIGHT,
        });
  
        CONFIG.Canvas.visionModes.astralPerception = new foundry.canvas.perception.VisionMode({
            id: 'astralPerception',
            label: 'SR5.Vision.AstralPerception',
            canvas: {
                shader: foundry.canvas.rendering.shaders.ColorAdjustmentsSamplerShader,
                uniforms: {
                    saturation: 5,
                    tint: AstralPerceptionBackgroundVisionShader.COLOR_TINT,
                },
            },
            lighting: {
                background: { visibility: foundry.canvas.perception.VisionMode.LIGHTING_VISIBILITY.DISABLED },
                illumination: { visibility: foundry.canvas.perception.VisionMode.LIGHTING_VISIBILITY.DISABLED },
                coloration: { visibility: foundry.canvas.perception.VisionMode.LIGHTING_VISIBILITY.DISABLED },
            },
            vision: {
                darkness: { adaptive: false },
                background: { shader: AstralPerceptionBackgroundVisionShader },
            },
        });
    }

    static configureThermographicVision() {
        CONFIG.Canvas.detectionModes.thermographic = new ThermographicVisionDetectionMode({
            id: 'thermographic',
            label: 'SR5.Vision.ThermographicVision',
            type: foundry.canvas.perception.DetectionMode.DETECTION_TYPES.SIGHT,
        });
    }

    static configureLowlight() {
        CONFIG.Canvas.detectionModes.lowlight = new LowlightVisionDetectionMode({
            id: 'lowlight',
            label: 'SR5.Vision.LowLight',
            type: foundry.canvas.perception.DetectionMode.DETECTION_TYPES.SIGHT,
        });
    }

    static configureAR() {
        CONFIG.Canvas.detectionModes.augmentedReality = new AugmentedRealityVisionDetectionMode({
            id: 'augmentedReality',
            label: 'SR5.Vision.AugmentedReality',
            type: foundry.canvas.perception.DetectionMode.DETECTION_TYPES.SIGHT,
        });
    }

    static configureInfraredVision() {
        CONFIG.Canvas.detectionModes.infrared = new InfraredVisionDetectionMode({
            id: 'infrared',
            label: 'SR5.Vision.InfraredVision',
            type: foundry.canvas.perception.DetectionMode.DETECTION_TYPES.SIGHT,
        });
    }

    static configureUltrasoundVision() {
        CONFIG.Canvas.detectionModes.ultrasound = new UltrasoundDetectionMode({
            id: 'ultrasound',
            label: 'SR5.Vision.Ultrasound',
            type: foundry.canvas.perception.DetectionMode.DETECTION_TYPES.SIGHT,
        });
    }

    static patchDetectionModeLOSForAstral() {
        const detectionModePrototype = foundry.canvas.perception.DetectionMode.prototype as any & {
            _sr5AstralWallPatchApplied?: boolean;
        };
        if (detectionModePrototype._sr5AstralWallPatchApplied) return;

        const originalTestLOS = detectionModePrototype._testLOS as (...args: any[]) => boolean;
        detectionModePrototype._testLOS = function (...args: any[]) {
            const [visionSource, mode, target, test] = args;
            if (!originalTestLOS.call(this, visionSource, mode, target, test)) return false;

            const sourceState = sourcePerceptionState(visionSource);
            if (!sourceState.isAstral) return true;

            return astralLineOfSightClear(visionSource, test);
        };
        detectionModePrototype._sr5AstralWallPatchApplied = true;
    }
}
  
