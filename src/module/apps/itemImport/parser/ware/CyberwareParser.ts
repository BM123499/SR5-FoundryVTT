import { Parser } from '../Parser';
import { Cyberware } from '../../schema/CyberwareSchema';
import { ImportHelper as IH } from '../../helper/ImportHelper';
import { TranslationHelper as TH } from '../../helper/TranslationHelper';
import Ware = Shadowrun.WareItemData;

export class CyberwareParser extends Parser<Ware> {
    protected override parseType: string = 'bioware';

    protected override getSystem(jsonData: Cyberware): Ware['system'] {
        const system = this.getBaseSystem('Item');

        const essence = (jsonData.ess._TEXT || '0').match(/[0-9]\.?[0-9]*/g);
        if (essence !== null)
            system.essence = parseFloat(essence[0]);

        const capacity = (jsonData.capacity._TEXT || '0').match(/[0-9]+/g);
        if (capacity !== null)
            system.capacity = parseInt(capacity[0]);

        return system;
    }

    protected override async getFolder(jsonData: Cyberware): Promise<Folder> {
        const rootFolder = TH.getTranslation('Cyberware', {type: 'category'});
        const folderName = TH.getTranslation(jsonData.category._TEXT, {type: 'category'});

        return IH.getFolder('Item', rootFolder, folderName);
    }
}
