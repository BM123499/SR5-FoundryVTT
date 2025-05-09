import { SpellParserBase } from './SpellParserBase';
import { ImportHelper } from '../../helper/ImportHelper';
import SpellItemData = Shadowrun.SpellItemData;
import { Spell } from '../../schema/SpellsSchema';

export class CombatSpellParser extends SpellParserBase {
    protected override getSystem(jsonData: Spell): SpellItemData['system'] {
        const system = super.getSystem(jsonData);

        let descriptor = ImportHelper.StringValue(jsonData, 'descriptor');
        // A few spells have a missing descriptor instead of an empty string.
        // The field is <descriptor /> rather than <descriptor></descriptor>
        // which gets imported as undefined rather than empty string (sigh)
        // Rather than refactor our ImportHelper we'll handle it in here.
        if (descriptor === undefined) {
            descriptor = '';
        }

        // Lower case is needed for the system.
        system.combat.type = descriptor.includes('Indirect') ? 'indirect' : 'direct';

        return system;
    }
}
