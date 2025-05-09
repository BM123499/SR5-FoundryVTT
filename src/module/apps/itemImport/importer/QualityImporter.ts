import { Constants } from "./Constants";
import { DataImporter } from './DataImporter';
import { QualityParser } from '../parser/quality/QualityParser';
import { UpdateActionFlow } from '../../../item/flows/UpdateActionFlow';
import { QualitiesSchema } from "../schema/QualitiesSchema";

export class QualityImporter extends DataImporter {
    public files = ['qualities.xml'];

    CanParse(jsonObject: object): boolean {
        return jsonObject.hasOwnProperty('qualities') && jsonObject['qualities'].hasOwnProperty('quality');
    }

    async Parse(jsonObject: QualitiesSchema): Promise<Item> {
        const parser = new QualityParser();
        const items: Shadowrun.QualityItemData[] = [];

        for (const jsonData of jsonObject.qualities.quality) {
            // Check to ensure the data entry is supported and the correct category
            if (DataImporter.unsupportedEntry(jsonData)) {
                continue;
            }

            try {
                // Create the item
                const item = await parser.Parse(jsonData);

                // Add relevant action tests
                UpdateActionFlow.injectActionTestsIntoChangeData(item.type, item, item);

                items.push(item);
            } catch (error) {
                ui.notifications?.error("Failed Parsing Quality:" + (jsonData.name._TEXT ?? "Unknown"));
            }
        }

        // @ts-expect-error // TODO: TYPE: Remove this.
        return await Item.create(items, { pack: Constants.MAP_COMPENDIUM_KEY['Trait'].pack });
    }
}
