import { Constants } from './Constants';
import { DataImporter } from './DataImporter';
import { ComplexformsSchema } from '../schema/ComplexformsSchema';
import { UpdateActionFlow } from '../../../item/flows/UpdateActionFlow';
import { ComplexFormParser } from '../parser/complex-form/ComplexFormParser';

export class ComplexFormImporter extends DataImporter {
    public files = ['complexforms.xml'];

    CanParse(jsonObject: object): boolean {
        return jsonObject.hasOwnProperty('complexforms') && jsonObject['complexforms'].hasOwnProperty('complexform');
    }

    async Parse(jsonObject: ComplexformsSchema): Promise<Item> {
        const parser = new ComplexFormParser();
        const items: Shadowrun.ComplexFormItemData[] = [];

        for (const jsonData of jsonObject.complexforms.complexform) {
            // Check to ensure the data entry is supported
            if (DataImporter.unsupportedEntry(jsonData)) {
                continue;
            }

            try {
                // Create the item
                const item = await parser.Parse(jsonData);

                UpdateActionFlow.injectActionTestsIntoChangeData(item.type, item, item);

                items.push(item);
            } catch (error) {
                ui.notifications?.error("Failed Parsing Complex Form:" + (jsonData.name._TEXT ?? "Unknown"));
            }
        }

        // @ts-expect-error
        return await Item.create(items, { pack: Constants.MAP_COMPENDIUM_KEY['Magic'].pack }) as Item;
    }
}
