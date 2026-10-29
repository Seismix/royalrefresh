// Mounts a component into a fresh container and flushes its first render.
// vitest-setup.ts calls cleanup() after each test so effects never outlive the
// test that made them.
import { flushSync, mount, unmount, type Component } from "svelte"

const mounted: ReturnType<typeof mount>[] = []

export function render<Props extends Record<string, any>>(
    component: Component<Props>,
    props: Props = {} as Props,
): HTMLElement {
    const container = document.body.appendChild(document.createElement("div"))
    mounted.push(mount(component, { target: container, props }))
    flushSync()
    return container
}

export function cleanup() {
    for (const instance of mounted.splice(0)) unmount(instance)
}
