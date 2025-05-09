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

    async Parse(jsonObject: QualitiesSchema): Promise<void> {
        const items = await QualityImporter.ParseItemsParallel(
            jsonObject.qualities.quality,
            {
                compendiumKey: "Trait",
                parser: new QualityParser(),
                filter: jsonData => !DataImporter.unsupportedEntry(jsonData),
                injectActionTests: item => {
                    UpdateActionFlow.injectActionTestsIntoChangeData(item.type, item, item);
                },
                errorPrefix: "Failed Parsing Quality"
            }
        );

        // @ts-expect-error // TODO: TYPE: Remove this.
        await Item.create(items, { pack: Constants.MAP_COMPENDIUM_KEY['Trait'].pack });
    }
}
