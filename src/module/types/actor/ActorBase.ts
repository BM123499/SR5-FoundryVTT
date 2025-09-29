import { CommonData } from "./Common";
import { ModifierFieldPrep } from "../prep/ModifiersFieldPrep";

export abstract class ActorBase<DS extends ReturnType<typeof CommonData>> extends foundry.abstract.TypeDataModel<DS, Actor.Implementation> {
    override prepareBaseData() {
        ModifierFieldPrep.resetAllModifiers(this);
    }
}
