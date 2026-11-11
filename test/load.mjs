// Test loader: evaluates the card source (a plain script, as shipped in dist/) in an isolated context with
// minimal browser stubs, and returns the requested top-level bindings.
import { readFileSync } from "node:fs";
import vm from "node:vm";

export const load = (names) => {
  const src = readFileSync(new URL("../src/proxmox-card.js", import.meta.url), "utf8");
  class HTMLElement {
    attachShadow() {
      this.shadowRoot = { addEventListener() {}, innerHTML: "" };
      return this.shadowRoot;
    }
    dispatchEvent() {}
    setAttribute() {}
  }
  const registry = new Map();
  const context = {
    HTMLElement,
    customElements: { get: (n) => registry.get(n), define: (n, c) => registry.set(n, c) },
    window: { addEventListener() {}, removeEventListener() {} },
    document: { addEventListener() {}, removeEventListener() {} },
    console: { info() {}, error() {}, log() {} },
    CustomEvent: class {},
    setInterval: () => 0,
    clearInterval() {},
    Intl,
    Date,
  };
  vm.createContext(context);
  return vm.runInContext(`${src}\n;({ ${names.join(", ")} })`, context);
};
