import { mount } from "svelte"
import Options from "./Options.svelte"

const target = document.getElementById("app")

if (target) {
    mount(Options, {
        target,
    })
}
