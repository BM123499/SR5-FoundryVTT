import { BaseItem } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/documents.mjs';
import { XMLStrategy } from './XMLStrategy';
import { JSONStrategy } from './JSONStrategy';
import { SR5Item } from "../../../item/SR5Item";
import { ImportStrategy } from './ImportStrategy';
import { Constants } from '../importer/Constants';
import { TranslationHelper as TH } from './TranslationHelper';
type CompendiumKey = keyof typeof Constants.MAP_COMPENDIUM_KEY;

export enum ImportMode {
    XML = 1,
    JSON = 2,
}

export type OneOrMany<T> = T | T[];
export type ArrayItem<T> = T extends (infer U)[] ? U : never;
export type NotEmpty<T> = T extends object ? NonNullable<T> : never;

/**
 * An import helper to standardize data extraction.
 * Mostly conceived to reduced required refactoring if Chummer changes data file layout.
 * Also contains helper methods to safely parse values to appropriate types.
 */
export class ImportHelper {
    public static readonly CHAR_KEY = '_TEXT';

    private static s_Strategy: ImportStrategy = new XMLStrategy();
    private static folders: Record<string, Promise<Folder>> = {};

    public static SetMode(mode: ImportMode) {
        switch (mode) {
            case ImportMode.XML:
                ImportHelper.s_Strategy = new XMLStrategy();
                break;
            case ImportMode.JSON:
                ImportHelper.s_Strategy = new JSONStrategy();
                break;
        }
    }

    private constructor() {}

    /**
     * Ensures the provided value is returned as an array.
     * If the value is already an array, it is returned as-is.
     * If the value is a single item, it is wrapped in an array.
     * If the value is null or undefined, an empty array is returned.
     *
     * @template T The type of the elements.
     * @param {T | T[] | undefined | null} value The input value to normalize.
     * @returns {T[]} An array containing the input value(s), or an empty array.
    */
    public static getArray<T>(value: T | T[] | undefined | null): T[] {
        if (value)
            return Array.isArray(value) ? value : [value];
        return [];
    }

    /**
     * Reformat the name or subtype name so it matches the categories in config.ts
     * @param name The item's name or subtype name to reformat
     */
    public static formatAsSlug(name: string): string {
        return name.trim().toLowerCase().replace((/'|,|\[|\]|\(|\)/g), '').split((/-|\s|\//g)).join('-');
    }

    /**
     * Helper method to create a new folder.
     * @param name The name of the folder.
     * @param folder The parent folder.
     * @returns {Promise<Folder>} A promise that resolves with the folder object when the folder is created.
     */
    public static async NewFolder(ctype: CompendiumKey, name: string, folder: Folder | null = null): Promise<Folder> {
        const { pack, type } = Constants.MAP_COMPENDIUM_KEY[ctype];

        const folderCreated = await Folder.create(
            { name: name, type: type, folder: folder?.id ?? null },
            { pack: pack }
        );

        if (!folderCreated) throw new Error("Folder creation failed.");
        return folderCreated;
    }

    /**
     * Helper method to get or create a compendium collection.
     *
     * Retrieves a compendium by its mapped key. If the compendium does not exist, it will be created with the corresponding metadata.
     *
     * @param ctype The compendium key (e.g., "Actor" or "Item") mapped in MAP_COMPENDIUM_KEY.
     * @returns A promise that resolves with the compendium collection.
     * @throws If the compendium key is invalid or improperly formatted.
     */
    public static async GetCompendium(ctype: CompendiumKey): Promise<CompendiumCollection<CompendiumCollection.Metadata>> {
        const { pack, type } = Constants.MAP_COMPENDIUM_KEY[ctype];
        let compendium = game.packs.get(pack);

        // Create the compendium if it doesn't exist
        if (!compendium) {
            const [scope, packName] = pack.split(".");
            if (!scope || !packName) throw new Error(`Invalid compendium key: ${pack}`);

            const folderName = game.i18n.localize("SR5.Compendiums.Root");
            let currentFolder = game.folders?.find(
                (folder) => folder.name === folderName
                //@ts-expect-error
                && folder.type === "Compendium"
            );

            if (!currentFolder) {
                currentFolder = await Folder.create({
                    name: folderName,
                    //@ts-expect-error
                    type: "Compendium",
                    color: "#00cc00"
                });
            }

            // Create the compendium pack
            compendium = await CompendiumCollection.createCompendium({
                name: packName,
                label: game.i18n.localize(`SR5.Compendiums.${ctype}`),
                type: type,
                package: scope,
                private: false,
                path: `packs/${packName}`,
                ownership: {
                    PLAYER: "OBSERVER",
                    TRUSTED: "OBSERVER",
                    ASSISTANT: "OWNER"
                }
            });

            // Manually assign compendium to the folder via settings
            const config = game.settings.get("core", "compendiumConfiguration") ?? {};
            Object.assign(config, { [`world.${packName}`]: { folder: currentFolder?.id ?? null } });
            await game.settings.set("core", "compendiumConfiguration", config);
        }

        return compendium;
    }

    /**
     * Get / create a folder at a path in the items directory.
     *
     * Traverse path and match folder structure to the last and current path segments.
     *
     * @param folder_type The root path of the folder.
     * @param path The absolute path of the folder.
     * @param mkdirs If true, will make all folders along the hierarchy if they do not exist.
     * @returns A promise that will resolve with the found folder.
     */
    public static async GetFolderAtPath(ctype: CompendiumKey, path: string, mkdirs: boolean = false): Promise<Folder> {
        let currentFolder: Folder | undefined;
        let lastFolder: Folder | null = null;

        const compendium = await this.GetCompendium(ctype);

        const pathSegments = path.split('/');
        for (const pathSegment of pathSegments) {
            //@ts-expect-error: folders is not typed but exists in Foundry VTT v12
            currentFolder = compendium.folders?.find((folder: Folder) =>
                folder.name === pathSegment && folder.folder === lastFolder
            );
    
            if (!currentFolder && !mkdirs)
                throw new Error(`Unable to find folder: ${path}`);
            else if (!currentFolder)
                currentFolder = await ImportHelper.NewFolder(ctype, pathSegment, lastFolder);
    
            lastFolder = currentFolder;
        }
    
        if (!currentFolder) throw new Error(`Failed to resolve folder at path: ${path}`);
        return currentFolder;
    }

    /**
     * Get a value from the the provided jsonData, optionally returning a default value if it is not found
     * or is unable to be parsed to an integer.
     * @param jsonData The data to get the keyed value in.
     * @param key The key to check for the value under.
     * @param fallback An optional default value to return if the key is not found.
     */
    public static IntValue(jsonData: object, key: string, fallback: number | undefined = undefined): number {
        return ImportHelper.s_Strategy.intValue(jsonData, key, fallback);
    }

    /**
     * Get a value from the the provided jsonData, optionally returning a default value if it is not found.
     * @param jsonData The data to get the keyed value in.
     * @param key The key to check for the value under.
     * @param fallback An optional default value to return if the key is not found.
     */
    public static StringValue(jsonData: object, key: string | number, fallback: string | undefined = undefined): string {
        return ImportHelper.s_Strategy.stringValue(jsonData, key, fallback);
    }

    /**
     * Get an object from the the provided jsonData, optionally returning a default value if it is not found.
     * @param jsonData The data to get the keyed value in.
     * @param key The key to check for the value under.
     * @param fallback An optional default value to return if the key is not found.
     */
    public static ObjectValue(jsonData: object, key: string | number, fallback: object | null | undefined = undefined): object | null {
        return ImportHelper.s_Strategy.objectValue(jsonData, key, fallback);
    }

    public static async findItem(
        compKey: CompendiumKey,
        name: OneOrMany<string>,
        types?: OneOrMany<BaseItem['data']['type']>
    ): Promise<SR5Item[]> {
        if (Array.isArray(name) ? name.length === 0 : !name) return [];

        type ItemType = CompendiumCollection<CompendiumCollection.Metadata & {type: 'Item'}>;
        const pack = game.packs?.get(Constants.MAP_COMPENDIUM_KEY[compKey].pack) as ItemType;

        return pack.getDocuments({
            name__in: this.getArray(name).map(name => TH.getTranslation(name)),
            ...(types ? { type__in: this.getArray(types) } : {})
        });
    }

    public static async getFolder(ctype: CompendiumKey, folder1: string, folder2?: string, folder3?: string): Promise<Folder> {
        let folder = this.folders[folder1] ??= this.NewFolder(ctype, folder1);

        if (folder2)
            folder = this.folders[`${folder1}/${folder2}`] ??= this.NewFolder(ctype, folder2, await folder);

        if (folder3)
            folder = this.folders[`${folder1}/${folder2}/${folder3}`] ??= this.NewFolder(ctype, folder3, await folder);

        return folder;
    }
}
