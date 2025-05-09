import { SR5 } from "../../../config";
import { Constants } from './Constants';
import { SR5Actor } from '../../../actor/SR5Actor';
import { ImportHelper as IH } from '../helper/ImportHelper';
type CompendiumKey = keyof typeof Constants.MAP_COMPENDIUM_KEY;

const xml2js = require('xml2js');

/**
 * The most basic chummer item data importer, meant to handle one or more Chummer5a data <type>.xml file.
 *
 * Generic type ItemDataType is the items data type DataImporter creates per entry in that Chummer5a data .xml file.
 */
export abstract class DataImporter {
    public abstract files: string[];
    public static translationMap: Record<string, any> = {};
    public static unsupportedBooks: string[] = ['2050'];
    public static iconList: string[];
    public static SR5 = SR5;

    // Used to filter down a files entries based on category.
    // See filterObjects for use.
    // Leave on null to support all categories.
    public unsupportedCategories: string[]|null = [];

    /**
     * Validate if this importer is capable of parsing the provided JSON data.
     * @param jsonObject JSON data to check import capability for.
     * @returns boolean True if the importer is capable of parsing the provided XML data.
     */
    public abstract CanParse(jsonObject: object): boolean;

    /**
     * Parse the specified jsonObject and return Item representations.
     * @param chummerData The JSON data to parse.
     * @returns An array of created objects.
     */
    public abstract Parse(chummerData: object): Promise<Item|StoredDocument<SR5Actor>[]>;

    /**
     * Parse an XML string into a JSON object.
     * @param xmlString The string to parse as XML.
     * @returns A json object converted from the string.
     */
    public static async xml2json(xmlString: string): Promise<object> {
        const parser = xml2js.Parser({
            explicitArray: false,
            explicitCharkey: true,
            charkey: IH.CHAR_KEY,
        });

        return (await parser.parseStringPromise(xmlString))['chummer'];
    }

    public static unsupportedBookSource(jsonObject) {
        if (!jsonObject.hasOwnProperty('source')) return false;
        const source = IH.StringValue(jsonObject, 'source', '');
        return DataImporter.unsupportedBooks.includes(source);
    }

    public static unsupportedEntry(jsonObject) {
        if (DataImporter.unsupportedBookSource(jsonObject)) {
            return true;
        }

        return false;
    }

    /**
     * Filter down objects to those actaully imported.
     *
     * Sometimes a single Chummer xml file contains mulitple 'categories' that don't mix with system types
     *
     * @param objects
     * @returns A subset of objects
     */
    filterObjects<T>(objects: T) : T {
        if (!this.unsupportedCategories) return objects;
        //@ts-expect-error
        return objects.filter(object => !this.unsupportedCategories.includes(IH.StringValue(object, 'category', '')));
    }

    public static async getFolder(compendium: CompendiumKey, ...folderPath: (string | undefined)[]) : Promise<Folder> {
        const pathParts = folderPath.filter(Boolean);

        if (pathParts.length > 3) throw new Error("Too long path: maximum folder depth is 3");

        const path = pathParts.join("/");
        return await IH.GetFolderAtPath(compendium, path, true);
    }
}
