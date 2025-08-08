import "../options/app.css"
import Options from "../options/Options.svelte"
import { mount } from "svelte"

const target = document.getElementById("app")

if (target) {
    mount(Options, {
        target,
    })
}
