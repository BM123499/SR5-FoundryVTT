import { Parser } from '../Parser';
import { Power } from '../../schema/CritterpowersSchema';
import { ImportHelper as IH } from '../../helper/ImportHelper';
import { TranslationHelper as TH } from '../../helper/TranslationHelper';
import CritterPowerCategory = Shadowrun.CritterPowerCategory;
import CritterPowerItemData = Shadowrun.CritterPowerItemData;

export class CritterPowerParser extends Parser<CritterPowerItemData> {
    protected override parseType: string = 'critter_power';

    protected override getSystem(jsonData: Power): CritterPowerItemData['system'] {
        const system =  this.getBaseSystem('Item');

        const category = jsonData.category._TEXT.toLowerCase();
        system.category = (category.includes("infected") ? "infected" : category) as CritterPowerCategory;

        system.duration = jsonData.duration ? jsonData.duration._TEXT.toLowerCase() : "";

        const range = jsonData.range ? jsonData.range._TEXT : "";
        system.range = Parser.rangeMap[range] ?? 'special';

        const type = jsonData.type ? jsonData.type._TEXT : "";
        system.powerType = Parser.typeMap[type] ?? "";

        system.rating = 1;

        return system;
    }

    protected override async getFolder(jsonData: Power): Promise<Folder> {
        const rootFolder = "Critter Powers";
        const category = TH.getTranslation(jsonData.category._TEXT, { type: 'category' });
        const path = `${rootFolder}/${category}`;

        return this.folders[path] ??= IH.GetFolderAtPath("Trait", path, true);;
    }
}
