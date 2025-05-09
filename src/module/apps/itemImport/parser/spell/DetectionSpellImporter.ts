import { SpellParserBase } from './SpellParserBase';
import { ImportHelper } from '../../helper/ImportHelper';
import SpellItemData = Shadowrun.SpellItemData;
import { Spell } from '../../schema/SpellsSchema';

export class DetectionSpellImporter extends SpellParserBase {
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

        system.detection.passive = descriptor.includes('Passive');
        if (!system.detection.passive) {
            system.action.opposed.type = 'custom';
            system.action.opposed.attribute = 'willpower';
            system.action.opposed.attribute2 = 'logic';
        }

        system.detection.extended = descriptor.includes('Extended');

        if (descriptor.includes('Psychic')) {
            system.detection.type = 'psychic';
        } else if (descriptor.includes('Directional')) {
            system.detection.type = 'directional';
        } else if (descriptor.includes('Area')) {
            system.detection.type = 'area';
        }

        return system;
    }
}
