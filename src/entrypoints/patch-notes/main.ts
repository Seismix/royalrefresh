import { mount } from "svelte"
import PatchNotes from "./PatchNotes.svelte"

const target = document.getElementById("app")

if (target) {
    mount(PatchNotes, {
        target,
    })
}
