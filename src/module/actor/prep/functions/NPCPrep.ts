import {METATYPEMODIFIER, SR} from "../../../constants";

export class NPCPrep {
    /**
     * Apply modifiers that result from an NPCs metatype.
     * This method also should still run on any none NPC to remove eventually lingering NPC metatype modifiers.
     */
    static applyMetatypeModifiers(system: Actor.SystemOfType<'character'>) {
        if (!system.is_npc) return;

        const { attributes, metatype } = system;
        const metatypeModifier = SR.grunt.metatype_modifiers[metatype];

        if (!metatypeModifier) return;

        for (const [name, attribute] of Object.entries(attributes)) {
            const modifyBy = metatypeModifier.attributes[name] as number | undefined;
            if (modifyBy) {
                attribute.changes.push({
                    priority: 0,
                    unused: false,
                    value: modifyBy,
                    name: METATYPEMODIFIER,
                    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                });
            }
        }
    }
}
