import { Constants } from './Constants';
import { DataImporter } from './DataImporter';
import { VehiclesSchema } from '../schema/VehiclesSchema';
import { UpdateActionFlow } from '../../../item/flows/UpdateActionFlow';
import { VehicleModParserBase } from '../parser/mod/VehicleModParserBase';

export class VehicleModImporter extends DataImporter {
    public files = ['vehicles.xml'];

    CanParse(jsonObject: object): boolean {
        return jsonObject.hasOwnProperty('mods') && jsonObject['mods'].hasOwnProperty('mod');
    }

    async Parse(jsonObject: VehiclesSchema): Promise<Item> {
        const parser = new VehicleModParserBase();
        const datas: Shadowrun.ModificationItemData[] = [];

        for (const jsonData of jsonObject.mods.mod) {
            // Check to ensure the data entry is supported
            if (DataImporter.unsupportedEntry(jsonData)) {
                continue;
            }

            try {
                const item = await parser.Parse(jsonData);

                // Add relevant action tests
                UpdateActionFlow.injectActionTestsIntoChangeData(item.type, item, item);

                datas.push(item);
            } catch (error) {
                ui.notifications?.error("Failed Parsing Vehicle Mod:" + (jsonData.name._TEXT ?? "Unknown"));
                console.log(error);
            }
        }

        // @ts-expect-error // TODO: TYPE: Remove this.
        return await Item.create(datas, { pack: Constants.MAP_COMPENDIUM_KEY['Item'].pack });
    }
}
