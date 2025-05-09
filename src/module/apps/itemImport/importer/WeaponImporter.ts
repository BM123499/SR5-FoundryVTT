import { Constants } from './Constants';
import { DataImporter } from './DataImporter';
import { ParserMap } from '../parser/ParserMap';
import { WeaponsSchema } from '../schema/WeaponsSchema';
import { MeleeParser } from '../parser/weapon/MeleeParser';
import { ImportHelper as IH } from '../helper/ImportHelper';
import { RangedParser } from '../parser/weapon/RangedParser';
import { ThrownParser } from '../parser/weapon/ThrownParser';
import { WeaponParserBase } from '../parser/weapon/WeaponParserBase';
import { UpdateActionFlow } from '../../../item/flows/UpdateActionFlow';
import WeaponItemData = Shadowrun.WeaponItemData;

export class WeaponImporter extends DataImporter {
    public files = ['weapons.xml'];

    CanParse(jsonObject: object): boolean {
        return jsonObject.hasOwnProperty('weapons') && jsonObject['weapons'].hasOwnProperty('weapon');
    }

    async Parse(jsonObject: WeaponsSchema): Promise<Item> {
        const parser = new ParserMap<WeaponItemData>(WeaponParserBase.GetWeaponType, [
            { key: 'range', value: new RangedParser() },
            { key: 'melee', value: new MeleeParser() },
            { key: 'thrown', value: new ThrownParser() },
        ]);

        const items: WeaponItemData[] = [];

        for (const jsonData of jsonObject.weapons.weapon) {

            // Check to ensure the data entry is supported and the correct category
            if (DataImporter.unsupportedEntry(jsonData)) {
                continue;
            }

            try {
                // Create the item
                const item = await parser.Parse(jsonData);

                // Figure out item subtype
                let subType = '';
                // range/melee/thrown
                if (item.system.category) {
                    subType = IH.formatAsSlug(item.system.category);
                }
                // exception for thrown weapons and explosives
                const weaponCategory = IH.formatAsSlug(item.system.subcategory);
                if (!(subType && ( weaponCategory == 'gear'))) {
                    subType = weaponCategory;
                }
                // deal with explosives and their weird formatting
                if (weaponCategory == 'gear' && item.name.includes(':')) {
                    subType = IH.formatAsSlug(item.name.split(':')[0]);
                }

                // // Set Import Flags
                // item.system.importFlags = this.genImportFlags(item.name, item.type, subType);

                // // Default icon
                // if (setIcons) {item.img = await this.iconAssign(item.system.importFlags, item.system, this.iconList)};

                // Add relevant action tests
                UpdateActionFlow.injectActionTestsIntoChangeData(item.type, item, item);

                items.push(item);
            } catch (error) {
                console.log(error);
                ui.notifications?.error("Failed Parsing Weapon:" + (jsonData.name._TEXT ?? "Unknown"));
            }
        }

        // @ts-expect-error // TODO: TYPE: This should be removed after typing of SR5Item
        return await Item.create(items, { pack: Constants.MAP_COMPENDIUM_KEY['Item'].pack });
    }
}
