import { mount } from "svelte"
import "./app.css"
import Options from "./Options.svelte"

const target = document.getElementById("app")

if (target) {
    mount(Options, {
        target,
    })
}
