import { Constants } from './Constants';
import { DataImporter } from './DataImporter';
import { SR5Actor } from '../../../actor/SR5Actor';
import { VehiclesSchema } from '../schema/VehiclesSchema';
import { VehicleParser } from '../parser/vehicle/VehicleParser';

export class VehicleImporter extends DataImporter {
    public files = ["vehicles.xml"];

    CanParse(jsonObject: object): boolean {
        return jsonObject.hasOwnProperty('vehicles') && jsonObject['vehicles'].hasOwnProperty('vehicle');
    }

    async Parse(chummerData: VehiclesSchema): Promise<StoredDocument<SR5Actor>[]> {
        const actors: Shadowrun.VehicleActorData[] = [];
        const parser = new VehicleParser();

        for (const jsonData of chummerData.vehicles.vehicle) {

            // Check to ensure the data entry is supported and the correct category
            if (DataImporter.unsupportedEntry(jsonData)) {
                continue;
            }

            try {
                const actor = await parser.Parse(jsonData);

                actors.push(actor);
            } catch (error) {
                ui.notifications?.error("Failed Parsing Vehicle:" + (jsonData.name._TEXT ?? "Unknown"));
            }
        }

        // @ts-expect-error // TODO: TYPE: Remove this.
        return await Actor.create(actors, { pack: Constants.MAP_COMPENDIUM_KEY['Drone'].pack });
    }
}
