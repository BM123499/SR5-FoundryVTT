import { ModifiableValue, ModifiableValueType } from "../template/Base";
import { AnyObject, SimpleMerge } from "fvtt-types/utils";
import { SR5ActiveEffect } from "src/module/effect/SR5ActiveEffect";

import DataModel = foundry.abstract.DataModel;
import SchemaField = foundry.data.fields.SchemaField;
import { DataField } from "node_modules/fvtt-types/src/foundry/common/data/fields.mjs";

/**
 * A ModifiableSchemaField is a SchemaField that represents a ModifiableValue type, which 
 * holds further system functionality.
 * 
 * Foundry will hand over authority over applying value changes to SchemaFields, when the document
 * is using a DataModel schema.
 * 
 * ModifiableField alteres default Foundry mode behavior to allow the system to show the whole 
 * value resolution instead of just altering the total modified value.
 */
/**
 * A ModifiableField extends functionality for the ModifiableValue type for ActiveEffect change application
 * by allowing for more granular control over how changes are applied and displayed.
 * 
 * This is directly related to SR5ActiveEffect and its legacy application, both sharing the same application
 * logic.
 */
export class ModifiableField<
    Fields extends ReturnType<typeof ModifiableValue>,
    Options extends SchemaField.Options<Fields> = SchemaField.DefaultOptions,
    AssignmentType = SchemaField.Internal.AssignmentType<Fields, Options>,
    InitializedType = SchemaField.Internal.InitializedType<Fields, Options>,
    PersistedType extends AnyObject | null | undefined = SchemaField.Internal.PersistedType<Fields, Options>
> extends foundry.data.fields.SchemaField<Fields, Options, AssignmentType, InitializedType, PersistedType> {
    // return itself instead of child
    protected override _getField(path: string[]) {
        return this;
    }

    override _applyChangeCustom(value: InitializedType, delta: InitializedType, model: DataModel.Any, change: ActiveEffect.ChangeData) {
        const field = value as ModifiableValueType;
        if (!isNaN(Number(change.value)))
            field.mod.push({ name: change.effect.name, value: Number(change.value) });

        return undefined;
    }

    protected override _applyChangeOverride(value: InitializedType, delta: InitializedType, model: DataModel.Any, change: ActiveEffect.ChangeData) {
        const field = value as ModifiableValueType;
        if (!isNaN(Number(change.value)))
            field.override = { name: change.effect.name, value: Number(change.value) };

        return undefined;
    }

    protected override _applyChangeUpgrade(value: InitializedType, delta: InitializedType, model: DataModel.Any, change: ActiveEffect.ChangeData) {
        const field = value as ModifiableValueType;
        if (!isNaN(Number(change.value)) && (!field.upgrade || Number(change.value) > field.upgrade.value))
            field.upgrade = { name: change.effect.name, value: Number(change.value) };

        return undefined;
    }

    protected override _applyChangeDowngrade(value: InitializedType, delta: InitializedType, model: DataModel.Any, change: ActiveEffect.ChangeData) {
        const field = value as ModifiableValueType;
        if (!isNaN(Number(change.value)) && (!field.downgrade || Number(change.value) < field.downgrade.value))
            field.downgrade = { name: change.effect.name, value: Number(change.value) };

        return undefined;
    }

    /**
     * Avoid breaking sheet rendering by assuring Foundry never applies any naive multiplication of an 'object'
     */
    protected override _applyChangeMultiply(value: InitializedType, delta: InitializedType, model: DataModel.Any, change: ActiveEffect.ChangeData) {
        return undefined;
    }
}
