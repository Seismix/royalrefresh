import "./app.css"
import Options from "./Options.svelte"
import { mount } from "svelte"

const target = document.getElementById("app")

if (target) {
    mount(Options, {
        target,
    })
}
