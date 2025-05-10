import { Constants } from './Constants';
import { DataImporter } from './DataImporter';
import { ArmorSchema } from '../schema/ArmorSchema';
import { ArmorParser } from '../parser/armor/ArmorParser';
import { UpdateActionFlow } from '../../../item/flows/UpdateActionFlow';
import { SR5Item } from '../../../item/SR5Item';

export class ArmorImporter extends DataImporter {
    public files = ['armor.xml'];

    CanParse(jsonObject: object): boolean {
        return jsonObject.hasOwnProperty('armors') && jsonObject['armors'].hasOwnProperty('armor');
    }

    async Parse(jsonObject: ArmorSchema): Promise<void> {
        const items = await ArmorImporter.ParseItemsParallel(
            jsonObject.armors.armor,
            {
                compendiumKey: "Item",
                parser: new ArmorParser(),
                filter: jsonData => !DataImporter.unsupportedEntry(jsonData),
                injectActionTests: item => {
                    UpdateActionFlow.injectActionTestsIntoChangeData(item.type, item, item);
                },
                errorPrefix: "Failed Parsing Armor"
            }
        );

        // @ts-expect-error
        await Item.create(items, { pack: Constants.MAP_COMPENDIUM_KEY['Item'].pack });
    }    
}
