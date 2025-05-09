import { SpellParserBase } from './SpellParserBase';
import { ImportHelper } from '../../helper/ImportHelper';
import SpellItemData = Shadowrun.SpellItemData;
import { Spell } from '../../schema/SpellsSchema';

export class ManipulationSpellParser extends SpellParserBase {
    protected override getSystem(jsonData: Spell): SpellItemData['system'] {
        const system = super.getSystem(jsonData);

        // A few spells have a missing descriptor instead of an empty string.
        // The field is <descriptor /> rather than <descriptor></descriptor>
        // which gets imported as undefined rather than empty string (sigh)
        // Rather than refactor our ImportHelper we'll handle it in here.
        // Sometimes the field misses altogether.
        let descriptor = ImportHelper.StringValue(jsonData, 'descriptor', '');
        if (descriptor === undefined) {
            descriptor = '';
        }

        system.manipulation.environmental = descriptor.includes('Environmental');
        // Generally no resistance roll.

        system.manipulation.mental = descriptor.includes('Mental');
        if (system.manipulation.mental) {
            system.action.opposed.type = 'custom';
            system.action.opposed.attribute = 'logic';
            system.action.opposed.attribute2 = 'willpower';
        }

        system.manipulation.physical = descriptor.includes('Physical');
        if (system.manipulation.physical) {
            system.action.opposed.type = 'custom';
            system.action.opposed.attribute = 'body';
            system.action.opposed.attribute2 = 'strength';
        }
        system.manipulation.damaging = descriptor.includes('Damaging');
        if (system.manipulation.damaging) {
            system.action.opposed.type = 'soak';
        }

        return system;
    }
}
