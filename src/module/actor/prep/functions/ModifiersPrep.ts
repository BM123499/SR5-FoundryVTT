import { ModifiableValueType } from "@/module/types/template/Base";

export class ModifierPrep {

    static readonly applyModifiers = {
        // Limits
        'physical_limit': 'limits.physical',
        'mental_limit': 'limits.mental',
        'social_limit': 'limits.social',

        // Initiative
        'meat_initiative': 'initiative.meatspace.base',
        'meat_initiative_dice': 'initiative.meatspace.dice',
        'astral_initiative': 'initiative.astral.base',
        'astral_initiative_dice': 'initiative.astral.dice',
        'matrix_initiative': 'initiative.matrix.base',
        'matrix_initiative_dice': 'initiative.matrix.dice',

        // Tracks
        'physical_track': 'track.physical',
        'stun_track': 'track.stun',
        'matrix_track': 'matrix.condition_monitor',
        'physical_overflow_track': 'track.physical.overflow',

        // Combat/Defense
        'armor': 'armor',
        'recoil': 'values.recoil',
    } as const satisfies Record<string, string>;

    static setAllModifiers(system: Actor.Implementation['system']) {
        for (const [modKey, targetPath] of Object.entries(this.applyModifiers)) {
            if (!(modKey in system.modifiers) || !system.modifiers[modKey]) continue;
            const modValue = system.modifiers[modKey] as number;
            const targetField = foundry.utils.getProperty(system, targetPath) as ModifiableValueType;

            targetField.changes.push({
                name: `SR5.Bonus`,
                value: modValue,
                mode: 2,
                unused: false,
                priority: 20
            });
        }
    }
}
