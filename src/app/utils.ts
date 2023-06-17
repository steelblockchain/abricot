export function mark_function(fn: any, key: string): void {
    Object.assign(fn, { [key]: true });
}
