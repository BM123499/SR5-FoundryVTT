import { Parser } from '../Parser';
import { Accessory } from '../../schema/WeaponsSchema';
import { ImportHelper as IH } from '../../helper/ImportHelper';
import { TranslationHelper as TH } from '../../helper/TranslationHelper';
import ModificationItemData = Shadowrun.ModificationItemData;
import MountType = Shadowrun.MountType;

export class WeaponModParserBase extends Parser<ModificationItemData> {
    protected override parseType: string = 'modification';

    protected override getSystem(jsonData: Accessory): ModificationItemData['system'] {
        const system = this.getBaseSystem('Item');

        system.type = 'weapon';

        system.mount_point = jsonData.mount ? (jsonData.mount._TEXT.toLowerCase() as MountType) : "";

        system.rc = Number(jsonData.rc?._TEXT) || 0;
        system.accuracy = Number(jsonData.accuracy?._TEXT) || 0;

        return system;
    }

    protected override async getFolder(jsonData: Accessory): Promise<Folder> {
        const category = jsonData.mount ? jsonData.mount._TEXT : "Other";
        const folderName = TH.getTranslation(category, {type: 'accessory'});
        const weapon = TH.getTranslation('Weapon', {type: 'category'}); 
        const mods = TH.getTranslation('Mods', {type: 'category'}); 

        const path = `${weapon}-${mods}/${folderName}`;

        return this.folders[path] ??= IH.GetFolderAtPath("Item", path, true);
    }
}
