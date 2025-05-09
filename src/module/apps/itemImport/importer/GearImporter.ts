import { Constants } from './Constants';
import { DataImporter } from './DataImporter';
import { GearSchema } from '../schema/GearSchema';
import { AmmoParser } from '../parser/gear/AmmoParser';
import { DeviceParser } from '../parser/gear/DeviceParser';
import { ProgramParser } from '../parser/gear/ProgramParser';
import { EquipmentParser } from '../parser/gear/EquipmentParser';
import { UpdateActionFlow } from '../../../item/flows/UpdateActionFlow';

type gearTypes = Shadowrun.EquipmentItemData | Shadowrun.AmmoItemData |
                 Shadowrun.DeviceItemData | Shadowrun.ProgramItemData;

export class GearImporter extends DataImporter {
    public files = ['gear.xml'];

    CanParse(jsonObject: object): boolean {
        return jsonObject.hasOwnProperty('gears') && jsonObject['gears'].hasOwnProperty('gear');
    }

    async Parse(jsonObject: GearSchema): Promise<Item> {
        const items: gearTypes[] = [];
        const ammoParser = new AmmoParser();
        const deviceParser = new DeviceParser();
        const programParser = new ProgramParser();
        const equipmentParser = new EquipmentParser();

        const programTypes = ['Hacking Programs', 'Common Programs'];
        const deviceTypes = ['Commlinks', 'Cyberdecks', 'Rigger Command Consoles'];

        for (const jsonData of jsonObject.gears.gear) {
            // Check to ensure the data entry is supported
            if (
                DataImporter.unsupportedEntry(jsonData) ||
                jsonData.id._TEXT === 'd63eb841-7b15-4539-9026-b90a4924aeeb'
            ) {
                continue;
            }

            try {
                const category = jsonData.category._TEXT;

                const selectedParser = category === "Ammunition"        ? ammoParser
                                     : deviceTypes.includes(category)   ? deviceParser
                                     : programTypes.includes(category)  ? programParser
                                                                        : equipmentParser; 

                const item = await selectedParser.Parse(jsonData);

                UpdateActionFlow.injectActionTestsIntoChangeData(item.type, item, item);

                items.push(item);
            } catch (error) {
                ui.notifications?.error("Failed Parsing Complex Form:" + (jsonData.name._TEXT ?? "Unknown"));
            }
        }

        // @ts-expect-error
        return await Item.create(items, { pack: Constants.MAP_COMPENDIUM_KEY['Item'].pack }) as Item;
    }
}
