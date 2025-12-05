import {
    pgTable,
    timestamp,
} from "drizzle-orm/pg-core";

type ColumnBuildersMap = Record<string, any>;

export interface ITableBuilder<TCols extends ColumnBuildersMap> {
    addColumn<Key extends string, Col extends any>(
        key: Key,
        col: Col
    ): ITableBuilder<TCols & Record<Key, Col>>;

    extend<TAdded extends ColumnBuildersMap>(extra: TAdded): ITableBuilder<TCols & TAdded>;

    timestamps(): ITableBuilder<
        TCols & {
            createdAt: ReturnType<typeof timestamp>;
            updatedAt: ReturnType<typeof timestamp>;
        }
    >;

    build(): ReturnType<typeof pgTable<string, TCols>>;
}

const createBuilder = <TCols extends ColumnBuildersMap>(
    name: string,
    columns: TCols
): ITableBuilder<TCols> => {
    return {
        addColumn(key, col) {
            return createBuilder(name, { ...columns, [key]: col });
        },

        extend(extra) {
            return createBuilder(name, { ...columns, ...extra });
        },

        timestamps() {
            const timeCols = {
                createdAt: timestamp("created_at").defaultNow().notNull(),
                updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
            };

            return createBuilder(name, { ...columns, ...timeCols });
        },

        build() {
            return pgTable(name, columns);
        },
    } as ITableBuilder<TCols>;
};

export const defineTable = (name: string) => ({
    columns<T extends ColumnBuildersMap>(cols: T) {
        return createBuilder(name, cols);
    },
});
