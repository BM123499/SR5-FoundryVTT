import { PartsList } from '../../../parts/PartsList';
import { SR5 } from "../../../config";
import { AttributesPrep } from "./AttributesPrep";
import { SR5Item } from 'src/module/item/SR5Item';
import { DataDefaults } from '@/module/data/DataDefaults';

export class MatrixPrep {
    /**
     * Prepare Matrix data on the actor
     * - if an item is equipped, it will use that data
     * - if it isn't and player is technomancer, it will use that data
     */
    static prepareMatrix(system: Actor.SystemOfType<'character' | 'critter'>, items: SR5Item[]) {
        const { matrix, attributes, modifiers } = system;

        const MatrixList = ['firewall', 'sleaze', 'data_processing', 'attack'] as const;

        // clear matrix data to defaults
        for (const key of MatrixList) {
            const parts = new PartsList(matrix[key].mod);
            if (matrix[key].temp) parts.addUniquePart('SR5.Temporary', matrix[key].temp);
            parts.removePart('Temporary');
            matrix[key].mod = parts.list;
            matrix[key].value = parts.total;
        }

        matrix.condition_monitor.max = 0;
        matrix.rating = 0;
        matrix.name = '';
        matrix.device = '';
        matrix.condition_monitor.label = 'SR5.ConditionMonitor';

        // get the first equipped device, we don't care if they have more equipped -- it shouldn't happen
        const device = items.find((item) => item.isEquipped() && item.isType('device')) as SR5Item<'device'>;

        if (device && !device.isLivingPersona()) {
            matrix.device = device._id!;

            const conditionMonitor = device.getConditionMonitor();

            matrix.condition_monitor.max = conditionMonitor.max + modifiers.matrix_track;
            matrix.condition_monitor.value = conditionMonitor.value;
            matrix.rating = device.getRating();
            matrix.is_cyberdeck = device.system.category === 'cyberdeck';
            matrix.name = device.name;
            matrix.item = device.system;
            matrix.running_silent = device.isRunningSilent();
            const deviceAtts = device.getASDF();
            // setup the actual matrix attributes for the actor
            for (const [key, value] of Object.entries(deviceAtts)) {
                // create a new attribute field from the current one, this also works if the matrix[key] field doesn't exist
                const att = DataDefaults.createData('attribute_field', matrix[key]);
                att.base = value.value;
                att['device_att'] = value.device_att;
                matrix[key] = att;
            }
        } // if we don't have a device, use living persona
        else if (system.special === 'resonance') {
            matrix.firewall.base = attributes.willpower.value;
            matrix.data_processing.base = attributes.logic.value;
            matrix.rating = attributes.resonance.value;
            matrix.attack.base = attributes.charisma.value;
            matrix.sleaze.base = attributes.intuition.value;
            // if we have a Living Persona device, we want to use some of its data to make the sheet sync up best
            if (device && device.isLivingPersona()) {
                matrix.device = device._id!;
                // use the living persona item to determine if we are running silent
                matrix.running_silent = device.isRunningSilent();
                // use the name of the item rather than a localization of ours, allows for more customization
                matrix.name = device.name;
            } else {
                // if we didn't have a Living Persona device, set the name to Living Persona as a basic thing
                matrix.name = game.i18n.localize('SR5.LivingPersona');
            }
        }

        // set matrix condition monitor to max if greater than
        if (matrix.condition_monitor.value > matrix.condition_monitor.max) {
            matrix.condition_monitor.value = matrix.condition_monitor.max;
        }

        // Add Rating as an Attribute Field to the actor's Attributes
        // this should only happen for character's and critters
        const ratingAtt = DataDefaults.createData('attribute_field', { base: matrix.rating, value: matrix.rating, hidden: true, });
        AttributesPrep.prepareAttribute('rating', ratingAtt);
        attributes['rating'] = ratingAtt;
    }

    /**
     * Add Matrix Attributes to Limits and Attributes
     * @param system
     */
    static prepareMatrixToLimitsAndAttributes(system: Actor.SystemOfType<'character' | 'critter' | 'ic' | 'sprite' | 'vehicle'>) {
        const { matrix, attributes, limits } = system;

        // add matrix attributes to both limits and attributes as hidden entries
        for (const attributeName of Object.keys(SR5.matrixAttributes) as Array<keyof typeof SR5.matrixAttributes>) {
            const attribute = matrix[attributeName];
            AttributesPrep.prepareAttribute(attributeName, attribute);
            const { value, base, mod, label } = attribute;

            limits[attributeName] = {
                ...limits[attributeName],
                ...{ value, base, mod, label, hidden: true }
            };

            attributes[attributeName] = {
                ...attributes[attributeName],
                ...{ value, base, mod, label, hidden: true }
            };
        }
    }

    static prepareMatrixAttributesForDevice(system: Actor.SystemOfType<'vehicle'>, rating?: number) {
        const { matrix } = system;
        rating = rating ?? matrix.rating;
        const matrixAttributes = ['firewall', 'data_processing'] as const;
        for (const attribute of matrixAttributes) {
            matrix[attribute].base = rating;
        }
    }
}
