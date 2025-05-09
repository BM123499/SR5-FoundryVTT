import { Constants } from './Constants';
import { DataImporter } from './DataImporter';
import { CritterpowersSchema } from '../schema/CritterpowersSchema';
import { UpdateActionFlow } from '../../../item/flows/UpdateActionFlow';
import { SpritePowerParser } from '../parser/critter-power/SpritePowerParser';
import { CritterPowerParser } from '../parser/critter-power/CritterPowerParser';

export class CritterPowerImporter extends DataImporter {
    public files = ['critterpowers.xml'];

    CanParse(jsonObject: object): boolean {
        return jsonObject.hasOwnProperty('powers') && jsonObject['powers'].hasOwnProperty('power');
    }

    async Parse(chummerPowers: CritterpowersSchema): Promise<Item> {
        const items: (Shadowrun.CritterPowerItemData | Shadowrun.SpritePowerItemData)[] = [];
        const critterPowerParser = new CritterPowerParser();
        const spritePowerParser = new SpritePowerParser();

        for (const jsonData of chummerPowers.powers.power) {
            // Check to ensure the data entry is supported
            if (DataImporter.unsupportedEntry(jsonData)) {
                continue;
            }

            try {
                const isSpiritPower = jsonData.category._TEXT !== "Emergent";

                // Create the item
                const item = isSpiritPower ? await critterPowerParser.Parse(jsonData)
                                           : await spritePowerParser.Parse(jsonData);

                // Add relevant action tests
                UpdateActionFlow.injectActionTestsIntoChangeData(item.type, item, item);

                items.push(item);
            } catch (error) {
                ui.notifications?.error("Failed Parsing Critter Power:" + (jsonData.name._TEXT ?? "Unknown"));
            }
        }

        // @ts-expect-error // TODO: TYPE: Remove this.
        return await Item.create(items, { pack: Constants.MAP_COMPENDIUM_KEY['Trait'].pack });
    }
}
