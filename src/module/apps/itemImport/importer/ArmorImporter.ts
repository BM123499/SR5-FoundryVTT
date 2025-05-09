import { Constants } from './Constants';
import { DataImporter } from './DataImporter';
import { ArmorSchema } from '../schema/ArmorSchema';
import { ArmorParser } from '../parser/armor/ArmorParser';
import { UpdateActionFlow } from '../../../item/flows/UpdateActionFlow';
import { ImportHelper } from '../helper/ImportHelper';

export class ArmorImporter extends DataImporter {
    public files = ['armor.xml'];

    CanParse(jsonObject: object): boolean {
        return jsonObject.hasOwnProperty('armors') && jsonObject['armors'].hasOwnProperty('armor');
    }

    async Parse(jsonObject: ArmorSchema): Promise<Item> {
        const parser = new ArmorParser();

        await ImportHelper.GetCompendium("Item");

        // Filter out unsupported entries first
        const supportedArmors = jsonObject.armors.armor.filter(jsonData => !DataImporter.unsupportedEntry(jsonData));

        const datas = await Promise.all(
            supportedArmors.map(async (jsonData) => {
                try {
                    const item = await parser.Parse(jsonData);

                    UpdateActionFlow.injectActionTestsIntoChangeData(item.type, item, item);

                    return item;
                } catch (error) {
                    ui.notifications?.error("Failed Parsing Armor: " + (jsonData.name?._TEXT ?? "Unknown"));
                    return null;
                }
            })
        );

        // Filter out nulls from failed parses
        const validItems = datas.filter((item): item is Shadowrun.ArmorItemData => item !== null);

        // @ts-expect-error
        return await Item.create(validItems, { pack: Constants.MAP_COMPENDIUM_KEY['Item'].pack }) as Item;
    }    
}
