import { Parser, ParseData } from './Parser';
import { ImportHelper } from '../helper/ImportHelper';

export class ParserMap<TResult extends (Shadowrun.ShadowrunActorData | Shadowrun.ShadowrunItemData)> extends Parser<TResult> {
    protected override getFolder(jsonData: ParseData): Promise<Folder> {
        throw new Error('Method not implemented.');
    }
    protected override parseType: string;

    protected override getSystem(jsonData: ParseData): TResult['system'] {
        throw new Error('Method not implemented.');
    }

    private readonly m_BranchKey: string | BranchFunc<TResult>;
    private readonly m_Map: Map<string, Parser<TResult>>;

    public constructor(branchKey: string | BranchFunc<TResult>, elements: CArg<TResult>[]) {
        super();

        this.m_BranchKey = branchKey;

        this.m_Map = new Map();
        for (const { key, value } of elements) {
            this.m_Map.set(key, value);
        }
    }

    public override async Parse(jsonData: ParseData): Promise<TResult> {
        let key;
        if (typeof this.m_BranchKey === 'function') {
            key = this.m_BranchKey(jsonData);
        } else {
            key = this.m_BranchKey;
            key = ImportHelper.StringValue(jsonData, key);
        }

        const parser = this.m_Map.get(key);
        if (!parser) throw new Error(`Parser not found for key: ${key}`);

        return await parser.Parse(jsonData);
    }
}

type CArg<TResult extends (Shadowrun.ShadowrunActorData | Shadowrun.ShadowrunItemData)> = {
    key: string;
    value: Parser<TResult>;
};
type BranchFunc<TResult> = (TResult) => string;
