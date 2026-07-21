import { ACTION_ID, validateManifest } from "./manifest-schema.js";

const CSP = "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

export const PREVIEW_CHANNEL = "yashOS-app-forge";
export const PREVIEW_VERSION = 1;

function previewRuntimeSource() {
  const manifest = __FORGE_MANIFEST__;
  const app = document.getElementById("app");
  const initial = structuredClone(manifest.data);
  let model = structuredClone(initial);
  let selected = "";
  let paused = false;
  let lastAction = "";

  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const values = (value) => Array.isArray(value) ? value : [];
  const itemsFor = (content) => values(
    content.items ?? content.series ?? content.days ?? content.messages ?? content.columns,
  );

  function renderComponent(component) {
    const card = el("section", undefined, "card");
    card.append(el("h2", component.title));
    const content = component.content || {};

    if (component.type === "hero") {
      card.append(el("p", content.text || manifest.summary));
    } else if (component.type === "stat-grid") {
      const grid = el("div", undefined, "stats");
      itemsFor(content).forEach((item) => grid.append(el("strong", String(item), "stat")));
      card.append(grid);
    } else if (component.type === "data-table") {
      const table = document.createElement("table");
      const header = document.createElement("tr");
      itemsFor(content).forEach((item) => header.append(el("th", String(item))));
      table.append(header);
      const rows = values(model.rows ?? model.observations ?? model.output ?? model.courses);
      (rows.length ? rows : ["No entries yet"]).forEach((row, index) => {
        const tr = document.createElement("tr");
        const cells = Array.isArray(row) ? row : [row, index % 2 ? "Ready" : "Queued"];
        itemsFor(content).forEach((_, cellIndex) => tr.append(el("td", String(cells[cellIndex] ?? ""))));
        table.append(tr);
      });
      card.append(table);
    } else if (component.type === "timeline" || component.type === "activity-log" || component.type === "chat") {
      const list = document.createElement(component.type === "chat" ? "ol" : "ul");
      const source = component.type === "activity-log"
        ? (model.log ?? content.items)
        : (content.items ?? content.messages);
      values(source).forEach((item) => list.append(el("li", String(item))));
      card.append(list);
    } else if (component.type === "calendar") {
      const grid = el("div", undefined, "calendar");
      itemsFor(content).forEach((day) => grid.append(el("button", String(day), "day")));
      card.append(grid);
    } else if (component.type === "form") {
      const form = document.createElement("form");
      values(content.fields).forEach((field) => {
        const label = el("label", String(field));
        const input = document.createElement("input");
        input.name = String(field).toLowerCase().replace(/\W+/g, "-");
        input.value = selected;
        label.append(input);
        form.append(label);
      });
      card.append(form);
    } else if (component.type === "chart" || component.type === "canvas") {
      const figure = el("div", undefined, "visual");
      const points = component.type === "chart" ? itemsFor(content) : [content.label || "State"];
      points.forEach((point, index) => {
        const bar = el("span", String(point), "bar");
        bar.style.setProperty("--size", `${35 + ((index + Number(model.steps || 0)) * 17) % 60}%`);
        figure.append(bar);
      });
      card.append(figure);
    }

    return card;
  }

  function reduce(type, action) {
    const rows = values(model.rows ?? model.observations ?? model.courses);
    if (type === "select") selected = selected ? "" : action.label;
    if (type === "filter") model.rows = rows.filter((_, index) => index % 2 === 0);
    if (type === "sort") model.rows = [...rows].reverse();
    if (type === "toggle") paused = !paused;
    if (type === "add") model.courses = [...values(model.courses), `Course ${values(model.courses).length + 1}`];
    if (type === "remove") model.courses = values(model.courses).slice(0, -1);
    if (type === "calculate") model.output = [[model.parameters?.join(" + ") || "Idea", "Generated translation"]];
    if (type === "simulate" && !paused) {
      model.steps = Number(model.steps || 0) + 1;
      model.log = [...values(model.log), `Completed step ${model.steps}`];
    }
    if (type === "reset") {
      model = structuredClone(initial);
      selected = "";
      paused = false;
    }
    if (type === "open-link") {
      lastAction = action.label;
      return;
    }
    lastAction = action.label;
  }

  function render() {
    app.replaceChildren();
    app.append(el("h1", manifest.title));
    manifest.components.forEach((component) => app.append(renderComponent(component)));
    const stateText = paused ? "Paused." : `Ready${selected ? `: ${selected}` : "."}`;
    const status = el("p", `${stateText}${lastAction ? ` Last action: ${lastAction}.` : ""}`, "status");
    const actions = el("div", undefined, "actions");

    manifest.actions.forEach((action) => {
      const button = el("button", action.label);
      button.type = "button";
      button.setAttribute("aria-pressed", String(action.type === "toggle" && paused));
      button.addEventListener("click", () => {
        reduce(action.type, action);
        render();
        parent.postMessage({
          channel: "yashOS-app-forge",
          version: 1,
          type: "action",
          actionId: action.id,
        }, "*");
      });
      actions.append(button);
    });
    app.append(status, actions);
  }

  render();
  parent.postMessage({ channel: "yashOS-app-forge", version: 1, type: "ready" }, "*");
}

const PREVIEW_RUNTIME = previewRuntimeSource.toString()
  .replace(/^[^{]*\{\s?|\}\s*$/g, "");

function checkedManifest(manifest) {
  const result = validateManifest(manifest);
  if (!result.ok) {
    const error = new RangeError("App Forge manifest is invalid.");
    error.code = result.errors[0] ?? "INVALID_MANIFEST";
    throw error;
  }
  return result.value;
}

export function buildPreviewSrcdoc(manifest) {
  const checked = checkedManifest(manifest);
  const payload = JSON.stringify(checked).replace(/</g, "\\u003c");
  const runtime = PREVIEW_RUNTIME.replace("__FORGE_MANIFEST__", payload);

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<style>
:root{color-scheme:dark;font:16px system-ui;background:#132033;color:#eef4ff}
body{margin:0;padding:16px}.card{margin:0 0 12px;padding:12px;border:1px solid #567;border-radius:10px;background:#1b2a40}
.actions,.stats,.calendar,.visual{display:flex;flex-wrap:wrap;gap:8px}button,input{min-height:44px;font:inherit}.stats .stat,.calendar .day{padding:8px;border-radius:8px;background:#243b58}
table{width:100%;border-collapse:collapse}th,td{padding:6px;text-align:left;border-bottom:1px solid #567}.bar{display:grid;align-items:end;min-width:72px;height:80px;padding:4px;background:linear-gradient(to top,#5b8cff var(--size),transparent var(--size))}
</style></head><body><main id="app" aria-live="polite"></main><script>${runtime}</script></body></html>`;
}

export function mountPreview(iframe, manifest) {
  const checked = checkedManifest(manifest);
  iframe.setAttribute("sandbox", "allow-scripts");
  iframe.setAttribute("title", `${checked.title} interactive preview`);
  iframe.srcdoc = buildPreviewSrcdoc(checked);
}

export function isAllowedPreviewMessage(event, iframeWindow) {
  if (!event || event.source !== iframeWindow || event.origin !== "null") return false;
  const data = event.data;
  if (data === null || typeof data !== "object" || Array.isArray(data)) return false;
  if (data.channel !== PREVIEW_CHANNEL || data.version !== PREVIEW_VERSION) return false;
  if (data.type === "ready") return Object.keys(data).length === 3;

  return data.type === "action"
    && Object.keys(data).length === 4
    && typeof data.actionId === "string"
    && ACTION_ID.test(data.actionId);
}

export function resolvePreviewOpenLink(event, iframeWindow, manifest) {
  if (!isAllowedPreviewMessage(event, iframeWindow) || event.data.type !== "action") return null;
  const checked = checkedManifest(manifest);
  const action = checked.actions.find(({ id }) => id === event.data.actionId);
  return action?.type === "open-link" ? action.href : null;
}
