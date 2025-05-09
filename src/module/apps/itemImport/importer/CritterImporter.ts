import { Constants } from './Constants';
import { DataImporter } from './DataImporter';
import { SR5Actor } from '../../../actor/SR5Actor';
import { MetatypeSchema } from "../schema/MetatypeSchema";
import { ImportHelper as IH } from '../helper/ImportHelper';
import { SpiritParser } from '../parser/metatype/SpiritParser';
import { SpriteParser } from '../parser/metatype/SpriteParser';
import { CritterParser } from '../parser/metatype/CritterParser';

type CrittersTypes = Shadowrun.CharacterData | Shadowrun.SpiritData | Shadowrun.SpriteData;
type CrittersDataTypes = Shadowrun.CharacterActorData | Shadowrun.SpiritActorData | Shadowrun.SpriteActorData;

export class CritterImporter extends DataImporter {
    public files = ['critters.xml'];

    CanParse(jsonObject: object): boolean {
        return jsonObject.hasOwnProperty('metatypes') && jsonObject['metatypes'].hasOwnProperty('metatype');
    }

    private isSpirit(jsonData: object): Boolean {
        const attributeKeys = [
            "bodmin", "agimin", "reamin",
            "strmin", "chamin", "intmin",
            "logmin", "wilmin", "edgmin",
        ];
    
        for (const key of attributeKeys)
            if (IH.StringValue(jsonData, key, "F").includes("F"))
                return true;

        return false;
    }

    async Parse(chummerData: MetatypeSchema): Promise<StoredDocument<SR5Actor>[]> {
        const actors: CrittersDataTypes[] = [];
        const critterParser = new CritterParser();
        const spiritParser = new SpiritParser();
        const spriteParser = new SpriteParser();

        const baseMetatypes = chummerData.metatypes.metatype;
        const metavariants = baseMetatypes.flatMap(metatype => {
            const parentName = metatype.name._TEXT;

            return IH.getArray(metatype.metavariants?.metavariant).map(variant => ({
                ...variant,
                name: { _TEXT: `${parentName} (${variant.name._TEXT})` },
                category: { _TEXT: metatype.category?._TEXT ?? "" },
            }));
        });

        const jsonDatas = [...baseMetatypes, ...metavariants];

        for (const jsonData of jsonDatas) {
            // Check to ensure the data entry is supported and the correct category
            if (DataImporter.unsupportedEntry(jsonData)) {
                continue;
            }

            try {
                const parseType = jsonData.category?._TEXT === 'Sprites' ? 'Sprite'
                    : this.isSpirit(jsonData) ? 'Spirit' : 'Critter';

                const selectedParser = parseType === 'Sprite' ? spriteParser
                    : parseType === 'Spirit' ? spiritParser : critterParser;

                const actor = await selectedParser.Parse(jsonData);

                actors.push(actor);
            } catch (error) {
                ui.notifications?.error("Failed Parsing Critter:" + (jsonData.name._TEXT ?? "Unknown"));
                console.log(error);
            }
        }

        // @ts-expect-error // TODO: TYPE: Remove this.
        return await Actor.create(actors, { pack: Constants.MAP_COMPENDIUM_KEY['Critter'].pack });
    }
}
