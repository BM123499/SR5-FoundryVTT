import { Parser } from "../Parser";
import AmmoItemData = Shadowrun.AmmoItemData;
import { Gear } from "../../schema/GearSchema";
import { ImportHelper as IH } from "../../helper/ImportHelper";
import { TranslationHelper as TH } from "../../helper/TranslationHelper";

export class AmmoParser extends Parser<AmmoItemData> {
    protected override parseType: string = 'ammo';

    protected override getSystem(jsonData: Gear): AmmoItemData['system'] {
        const system =  this.getBaseSystem('Item');

        const bonusData = jsonData.weaponbonus;;
        if (bonusData) {
            system.ap = Number(bonusData.ap?._TEXT) || 0;
            system.damage = Number(bonusData.damage?._TEXT) || 0;

            const damageType = bonusData.damagetype?._TEXT ?? '';
            if (damageType.length > 0) {
                if (damageType.includes('P')) {
                    system.damageType = 'physical';
                } else if (damageType.includes('S')) {
                    system.damageType = 'stun';
                } else if (damageType.includes('M')) {
                    system.damageType = 'matrix';
                }
            }
        }

        // // TODO: This can be improved by using the stored english name in item.system.importFlags.name
        // const nameLower = jsonData.name._TEXT.toLowerCase();
        // const shouldLookForWeapons = ['grenade', 'rocket', 'missile'].some(word => nameLower.includes(word));
        // // NOTE: Should either weapons or gear not have been imported with translation, this will fail.
        // if (shouldLookForWeapons) {
        //     const [foundWeapon] = await IH.findItem('Item', item.name, 'weapon') ?? [];

        //     if (foundWeapon && "action" in foundWeapon.system) {
        //         const weaponData = foundWeapon.system as Shadowrun.WeaponData;
        //         system.damage = weaponData.action.damage.value;
        //         system.ap =weaponData.action.damage.ap.value;
        //     }
        // }

        return system;
    }

    protected override async getFolder(jsonData: Gear): Promise<Folder> {
        let folderName = 'Misc';

        const splitName = TH.getTranslation(jsonData.name._TEXT).split(':');
        if (splitName.length > 1)
            folderName = splitName[0].trim();

        const rootFolder = TH.getTranslation('Ammunition', {type: 'category'});
        const path = `${rootFolder}/${folderName}`;

        return this.folders[path] ??= IH.GetFolderAtPath("Item", path, true);
    }
}