import { SR5 } from "../../../config";
import { ModifierFieldPrep } from '@/module/types/prep/ModifiersFieldPrep';

export class LimitsPrep {
    static prepareLimits(system: Actor.SystemOfType<'character' | 'critter' | 'spirit' | 'sprite' | 'vehicle'>) {
        const { limits, attributes, special } = system;

        // Default limits are derived directly from attributes.
        limits.physical.base = Math.ceil((2 * attributes.strength.value + attributes.body.value + attributes.reaction.value) / 3);
        limits.mental.base = Math.ceil((2 * attributes.logic.value + attributes.intuition.value + attributes.willpower.value) / 3);
        limits.social.base = Math.ceil((2 * attributes.charisma.value + attributes.willpower.value + attributes.essence.value) / 3);

        // Determine if the astral limit is relevant.
        if ('astral' in limits) {
            limits.astral.hidden = special !== 'magic';

            if (special === 'magic') {
                limits.astral.label = SR5.limits.astral;
                limits.astral.base = Math.max(limits.mental.value, limits.social.value);

                limits.magic.base = attributes.magic.value;
                limits.magic.label = attributes.magic.label;
            }
        }

        if (system.magic && 'initiation' in limits) {
            limits.initiation.hidden = true;
            limits.initiation.label = SR5.limits.initiation;
            limits.initiation.base = system.magic.initiation;

            // Helpers.calcTotal(limits.initiation, {min: 0});
        }

        // Late Update, because we need to have all base values set before applying modifiers.
        for (const [name, limit] of Object.entries(limits)) {
            ModifierFieldPrep.applyChanges(limit);
            limit.label = SR5.limits[name];
        }
    }
}
