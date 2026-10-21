import "./styles.css";
import { mount } from "./ui/app";
import { registerServiceWorker } from "./ui/install";

registerServiceWorker();

const root = document.getElementById("app");
if (root) mount(root);
