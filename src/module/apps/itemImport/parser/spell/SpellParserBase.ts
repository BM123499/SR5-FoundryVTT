import { Spell } from '../../schema/SpellsSchema';
import { Parser } from '../Parser';
import { ImportHelper as IH } from '../../helper/ImportHelper';
import { TranslationHelper as TH } from '../../helper/TranslationHelper';
import SpellCateogry = Shadowrun.SpellCateogry;
import SpellItemData = Shadowrun.SpellItemData;

export class SpellParserBase extends Parser<SpellItemData> {
    protected override parseType: string = 'spell';

    protected override getSystem(jsonData: Spell): SpellItemData['system'] {
        const system = this.getBaseSystem(
            'Item',
            {action: {type: 'varies', attribute: 'magic', skill: 'spellcasting'}} as Shadowrun.SpellData
        );

        system.category = IH.StringValue(jsonData, 'category').toLowerCase() as SpellCateogry;

        let damage = IH.StringValue(jsonData, 'damage');
        if (damage === 'P') {
            system.action.damage.type.base = 'physical';
            system.action.damage.type.value = 'physical';
        } else if (damage === 'S') {
            system.action.damage.type.base = 'stun';
            system.action.damage.type.value = 'stun';
        }

        let duration = IH.StringValue(jsonData, 'duration');
        if (duration === 'I') {
            system.duration = 'instant';
        } else if (duration === 'S') {
            system.duration = 'sustained';
        } else if (duration === 'P') {
            system.duration = 'permanent';
        }

        let drain = IH.StringValue(jsonData, 'dv');
        if (drain.includes('+') || drain.includes('-')) {
            system.drain = parseInt(drain.substring(1, drain.length));
        }

        let range = IH.StringValue(jsonData, 'range');
        if (range === 'T') {
            system.range = 'touch';
        } else if (range === 'LOS') {
            system.range = 'los';
        } else if (range === 'LOS (A)') {
            system.range = 'los_a';
        }

        let type = IH.StringValue(jsonData, 'type');
        if (type === 'P') {
            system.type = 'physical';
        } else if (type === 'M') {
            system.type = 'mana';
        }

        return system;
    }

    protected override async getFolder(jsonData: Spell): Promise<Folder> {
        const folderName = TH.getTranslation(jsonData.category._TEXT, {type: 'category'});

        return IH.getFolder("Magic", folderName);
    }
}
