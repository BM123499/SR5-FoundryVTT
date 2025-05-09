import { Constants } from './Constants';
import { DataImporter } from './DataImporter';
import { ImportHelper } from '../helper/ImportHelper';
import { WeaponsSchema } from '../schema/WeaponsSchema';
import { UpdateActionFlow } from '../../../item/flows/UpdateActionFlow';
import { WeaponModParserBase } from '../parser/mod/WeaponModParserBase';

export class WeaponModImporter extends DataImporter {
    public files = ['weapons.xml'];

    CanParse(jsonObject: object): boolean {
        return jsonObject.hasOwnProperty('accessories') && jsonObject['accessories'].hasOwnProperty('accessory');
    }

    async Parse(jsonObject: WeaponsSchema): Promise<Item> {
        const parser = new WeaponModParserBase();
        let datas: Shadowrun.ModificationItemData[] = [];

        for (const jsonData of jsonObject.accessories.accessory) {
            // Check to ensure the data entry is supported
            if (DataImporter.unsupportedEntry(jsonData)) {
                continue;
            }

            try {
                // Create the item
                const item = await parser.Parse(jsonData);

                // Add relevant action tests
                UpdateActionFlow.injectActionTestsIntoChangeData(item.type, item, item);

                datas.push(item);
            } catch (error) {
                ui.notifications?.error("Failed Parsing Weapon Mod:" + (jsonData.name._TEXT ?? "Unknown"));
            }
        }

        // @ts-expect-error // TODO: TYPE: Remove this.
        return await Item.create(datas, { pack: Constants.MAP_COMPENDIUM_KEY['Item'].pack });
    }
}
