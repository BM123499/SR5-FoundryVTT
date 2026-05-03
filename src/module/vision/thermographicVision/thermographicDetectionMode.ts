import { sourcePerceptionState, targetActor } from '../detectionModeHelpers';

type ThermographicTemperatureTier = 'neutral' | 'gelid' | 'cool' | 'warm' | 'boiling';

export default class ThermographicVisionDetectionMode extends foundry.canvas.perception.DetectionMode {
    static readonly #NEUTRAL_TIER: ThermographicTemperatureTier = 'neutral';
    static readonly #GLOW_COLORS: Readonly<Record<Exclude<ThermographicTemperatureTier, 'neutral'>, [number, number, number, number]>> = {
        boiling: [1.0, 0.1, 0.0, 1.0],
        warm: [1.0, 0.55, 0.0, 1.0],
        cool: [0.25, 0.5, 1.0, 1.0],
        gelid: [0.6, 0.3, 1.0, 1.0],
    };
    static readonly #FILTERS_BY_TIER = new Map<ThermographicTemperatureTier, PIXI.Filter>();
    static #pendingTier: ThermographicTemperatureTier | null = null;

    static override getDetectionFilter() {
        const tier = this.#pendingTier;
        this.#pendingTier = null;
        if (!tier || tier === this.#NEUTRAL_TIER) return undefined;

        let filter = this.#FILTERS_BY_TIER.get(tier);
        if (!filter) {
            filter = foundry.canvas.rendering.filters.GlowOverlayFilter.create({
                glowColor: this.#GLOW_COLORS[tier],
            });
            this.#FILTERS_BY_TIER.set(tier, filter);
        }
        return filter;
    }
  
    override _canDetect(
        ...[visionSource, target]: Parameters<foundry.canvas.perception.DetectionMode['_canDetect']>
    ) {
        const sourceState = sourcePerceptionState(visionSource);
        if (sourceState.isProjecting) return false;

        const actor = targetActor(target);
        const tier = ThermographicVisionDetectionMode.#resolveTemperatureTier(actor);
        if (!tier || tier === ThermographicVisionDetectionMode.#NEUTRAL_TIER) return false;
        ThermographicVisionDetectionMode.#pendingTier = tier;
        return true;
    }

    static #resolveTemperatureTier(actor: ReturnType<typeof targetActor>): ThermographicTemperatureTier | null {
        if (!actor) return null;

        const tier = actor.system.visibilityChecks?.meat?.temperatureTier;
        switch (tier) {
            case 'boiling':
            case 'warm':
            case 'cool':
            case 'gelid':
            case 'neutral':
                return tier;
            default:
                return actor.system.visibilityChecks?.meat?.hasHeat ? 'warm' : this.#NEUTRAL_TIER;
        }
    }
}
  
