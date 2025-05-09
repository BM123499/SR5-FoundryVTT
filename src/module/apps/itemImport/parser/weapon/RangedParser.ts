import { ImportHelper } from '../../helper/ImportHelper';
import { WeaponParserBase } from './WeaponParserBase';
import WeaponItemData = Shadowrun.WeaponItemData;
import { DataDefaults } from '../../../../data/DataDefaults';
import { Weapon } from '../../schema/WeaponsSchema';

export class RangedParser extends WeaponParserBase {
    protected GetAmmo(weaponJson: Weapon) {
        let jsonAmmo = ImportHelper.StringValue(weaponJson, 'ammo');
        let match = jsonAmmo.match(/([0-9]+)/g)?.[0];
        return match !== undefined ? parseInt(match) : 0;
    }

    protected override getSystem(jsonData: Weapon): WeaponItemData['system'] {
        const system = super.getSystem(jsonData);

        // Some new weapons don't have any rc defined in XML.
        if (jsonData.hasOwnProperty('rc')) {
            system.range.rc.base = ImportHelper.IntValue(jsonData, 'rc');
            system.range.rc.value = ImportHelper.IntValue(jsonData, 'rc');
        } else {
            system.range.rc.base = 0;
            system.range.rc.value = 0;
        }

        const rangeCategory = ImportHelper.StringValue(jsonData, jsonData.hasOwnProperty('range') ? 'range' : 'category');
        system.range.ranges = DataDefaults.weaponRangeData(this.GetRangeDataFromImportedCategory(rangeCategory));

        system.ammo.current.value = this.GetAmmo(jsonData);
        system.ammo.current.max = this.GetAmmo(jsonData);

        const modeData = ImportHelper.StringValue(jsonData, 'mode');
        system.range.modes = {
            single_shot: modeData.includes('SS'),
            semi_auto: modeData.includes('SA'),
            burst_fire: modeData.includes('BF'),
            full_auto: modeData.includes('FA'),
        };

        return system;
    }
}
