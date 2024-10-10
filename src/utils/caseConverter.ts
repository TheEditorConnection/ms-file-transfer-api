/**
 * 
 * @param snakeCaseObject 
 * @returns 
 */
export function snakeToCamel(snakeCaseObject: any): any {
    if (Array.isArray(snakeCaseObject)) {
        return snakeCaseObject.map(item => snakeToCamel(item));
    } else if (snakeCaseObject !== null && typeof snakeCaseObject === 'object') {
        return Object.keys(snakeCaseObject).reduce((acc: any, key: string) => {
            const camelCaseKey = key.replace(/(_\w)/g, (match) => match[1].toUpperCase());
            acc[camelCaseKey] = snakeToCamel(snakeCaseObject[key]);
            return acc;
        }, {});
    }
    return snakeCaseObject;
}

/**
 * 
 * @param camelCaseObject 
 * @returns 
 */
export function camelToSnake(camelCaseObject: any): any {
    if (Array.isArray(camelCaseObject)) {
        return camelCaseObject.map(item => camelToSnake(item));
    } else if (camelCaseObject !== null && typeof camelCaseObject === 'object') {
        return Object.keys(camelCaseObject).reduce((acc: any, key: string) => {
            const snakeCaseKey = key.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`);
            acc[snakeCaseKey] = camelToSnake(camelCaseObject[key]);
            return acc;
        }, {});
    }
    return camelCaseObject;
}
