export const devLog = {
    log: (...args: any[]) => {
        if (import.meta.env?.DEV) {
            console.log(...args)
        }
    },
}
