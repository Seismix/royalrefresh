import { mount } from "svelte"
import Popup from "./Popup.svelte"

const target = document.getElementById("app")

if (target) {
    mount(Popup, {
        target,
    })
}
