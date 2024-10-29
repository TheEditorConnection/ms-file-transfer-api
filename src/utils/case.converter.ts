/**
 * Converts an object from snake_case to camelCase.
 * @param snakeCaseObject - The object in snake_case format.
 * @returns The object in camelCase format.
 */
export function snakeToCamel(snakeCaseObject: unknown): unknown {
    if (Array.isArray(snakeCaseObject)) {
        return snakeCaseObject.map(item => snakeToCamel(item));
    } else if (snakeCaseObject !== null && typeof snakeCaseObject === 'object') {
        return Object.keys(snakeCaseObject).reduce((acc: Record<string, unknown>, key: string) => {
            const camelCaseKey = key.replace(/(_\w)/g, (match) => match[1].toUpperCase());
            acc[camelCaseKey] = snakeToCamel((snakeCaseObject as Record<string, unknown>)[key]);
            return acc;
        }, {});
    }
    return snakeCaseObject;
}

/**
 * Converts an object from camelCase to snake_case.
 * @param camelCaseObject - The object in camelCase format.
 * @returns The object in snake_case format.
 */
export function camelToSnake(camelCaseObject: unknown): unknown {
    if (Array.isArray(camelCaseObject)) {
        return camelCaseObject.map(item => camelToSnake(item));
    } else if (camelCaseObject !== null && typeof camelCaseObject === 'object') {
        return Object.keys(camelCaseObject).reduce((acc: Record<string, unknown>, key: string) => {
            const snakeCaseKey = key.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`);
            acc[snakeCaseKey] = camelToSnake((camelCaseObject as Record<string, unknown>)[key]);
            return acc;
        }, {});
    }
    return camelCaseObject;
}
