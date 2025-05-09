import { DataImporter } from './DataImporter';
import { SpellParserBase } from '../parser/spell/SpellParserBase';
import { CombatSpellParser } from '../parser/spell/CombatSpellParser';
import { ManipulationSpellParser } from '../parser/spell/ManipulationSpellParser';
import { IllusionSpellParser } from '../parser/spell/IllusionSpellParser';
import { DetectionSpellImporter } from '../parser/spell/DetectionSpellImporter';
import { ParserMap } from '../parser/ParserMap';
import { UpdateActionFlow } from '../../../item/flows/UpdateActionFlow';
import { Constants } from "./Constants";
import { SpellsSchema } from '../schema/SpellsSchema';

export class SpellImporter extends DataImporter{
    public files = ['spells.xml'];

    CanParse(jsonObject: object): boolean {
        return jsonObject.hasOwnProperty('spells') && jsonObject['spells'].hasOwnProperty('spell');
    }

    async Parse(jsonObject: SpellsSchema): Promise<Item> {
        const parser = new ParserMap<Shadowrun.SpellItemData>('category', [
            { key: 'Combat', value: new CombatSpellParser() },
            { key: 'Manipulation', value: new ManipulationSpellParser() },
            { key: 'Illusion', value: new IllusionSpellParser() },
            { key: 'Detection', value: new DetectionSpellImporter() },
            { key: 'Health', value: new SpellParserBase() },
            { key: 'Enchantments', value: new SpellParserBase() },
            { key: 'Rituals', value: new SpellParserBase() },
        ]);

        const items: Shadowrun.SpellItemData[] = [];

        for (const jsonData of jsonObject.spells.spell) {

            // Check to ensure the data entry is supported
            if (DataImporter.unsupportedEntry(jsonData)) {
                continue;
            }

            try {
                const item = await parser.Parse(jsonData);

                // Add relevant action tests
                UpdateActionFlow.injectActionTestsIntoChangeData(item.type, item, item);

                items.push(item);
            } catch (error) {
                ui.notifications?.error("Failed Parsing Spell:" + (jsonData.name._TEXT ?? "Unknown"));
            }
        }

        // @ts-expect-error // TODO: TYPE: Remove this.
        return await Item.create(items, { pack: Constants.MAP_COMPENDIUM_KEY['Magic'].pack });
    }
}
