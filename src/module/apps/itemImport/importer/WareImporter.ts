import { Constants } from "./Constants";
import { DataImporter } from './DataImporter';
import { BiowareParser } from '../parser/ware/BiowareParser';
import { CyberwareParser } from '../parser/ware/CyberwareParser';
import { Bioware, BiowareSchema } from '../schema/BiowareSchema';
import { Cyberware, CyberwareSchema } from '../schema/CyberwareSchema';
import { UpdateActionFlow } from '../../../item/flows/UpdateActionFlow';
import WareItemData = Shadowrun.WareItemData;

export class WareImporter extends DataImporter {
    public files = ['cyberware.xml', 'bioware.xml'];

    CanParse(jsonObject: object): boolean {
        return jsonObject.hasOwnProperty('biowares') && jsonObject['biowares'].hasOwnProperty('bioware') ||
               jsonObject.hasOwnProperty('cyberwares') && jsonObject['cyberwares'].hasOwnProperty('cyberware');
    }

    async Parse(jsonObject: BiowareSchema | CyberwareSchema): Promise<Item> {
        const items: WareItemData[] = [];

        const key = 'biowares' in jsonObject ? 'bioware' : 'cyberware';
        const bioParser = new BiowareParser();
        const cyberParser = new CyberwareParser();
        const jsonDatas = 'biowares' in jsonObject ? jsonObject.biowares.bioware
                                                   : jsonObject.cyberwares.cyberware;

        for (const jsonData of jsonDatas) {
            // Check to ensure the data entry is supported
            if (DataImporter.unsupportedEntry(jsonData)) {
                continue;
            }

            try {
                const item = key === 'bioware' ? await bioParser.Parse(jsonData as Bioware)
                                               : await cyberParser.Parse(jsonData as Cyberware);

                // Bioware has no wireless feature, so disable it by default
                if (key === 'bioware')
                    item.system.technology.wireless = false;

                // Add relevant action tests
                UpdateActionFlow.injectActionTestsIntoChangeData(item.type, item, item);

                items.push(item);
            } catch (error) {
                ui.notifications?.error("Failed Parsing Ware:" + (jsonData.name._TEXT ?? "Unknown"));
            }
        }

        // @ts-expect-error // TODO: TYPE: Remove this.
        return await Item.create(items, { pack: Constants.MAP_COMPENDIUM_KEY['Item'].pack });
    }
}
