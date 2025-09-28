import {METATYPEMODIFIER, SR} from "../../../constants";
import {PartsList} from "../../../parts/PartsList";
import {AttributesPrep} from "./AttributesPrep";

export class NPCPrep {
    static prepareNPCData(system: Actor.SystemOfType<'character'>) {
        // Apply to NPC and none NPC to remove lingering modifiers after actor has been removed it's npc status.
        NPCPrep.applyMetatypeModifiers(system);
    }

    /**
     * Apply modifiers that result from an NPCs metatype.
     * This method also should still run on any none NPC to remove eventually lingering NPC metatype modifiers.
     */
    static applyMetatypeModifiers(system: Actor.SystemOfType<'character'>) {
        // Extract needed data.
        const {attributes, metatype} = system;
        // Fallback to empty object if no metatype modifiers exist.
        const metatypeModifier = SR.grunt.metatype_modifiers[metatype] || {};

        for (const [name, attribute] of Object.entries(attributes)) {
            // // Remove lingering modifiers from NPC actors that aren't anymore.
            const parts = new PartsList(attribute.mod);
            // // Apply NPC modifiers
            // const modifyBy = metatypeModifier.attributes?.[name];
            // if (system.is_npc && modifyBy) {
            //     parts.addPart(METATYPEMODIFIER, modifyBy);
            // }

            // // Prepare attribute modifiers
            // attribute.mod = parts.list;

            AttributesPrep.calculateAttribute(name, attribute);
        }
    }
}
