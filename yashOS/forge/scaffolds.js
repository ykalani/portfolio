export const SCAFFOLD_IDS = Object.freeze([
  "schedule-planner", "analytics-dashboard", "workflow-builder",
  "simulation-console", "creative-workbench", "research-explorer",
]);

const component = (id, type, title, content) => ({ id, type, title, content });
const action = (id, type, label, href) => href
  ? { id, type, label, href }
  : { id, type, label };
const glass = (accent) => ({ accent, surface: "glass" });

export const SCAFFOLDS = new Map([
  ["schedule-planner", {
    createSeed(query) {
      return { theme: glass("#5b8cff"), data: { query, courses: ["Algorithms", "Databases"], events: ["Lecture", "Exam"] },
        components: [component("hero", "hero", "Schedule planner", { text: "Organize course events." }), component("calendar", "calendar", "Week", { days: ["Mon", "Tue", "Wed", "Thu", "Fri"] }), component("timeline", "timeline", "Upcoming", { items: ["Lecture", "Exam"] }), component("table", "data-table", "Courses", { columns: ["Course", "Status"] }), component("form", "form", "Add course", { fields: ["Course", "Date"] })],
        actions: [action("add-course", "add", "Add course"), action("remove-course", "remove", "Remove course"), action("reset-plan", "reset", "Reset")] };
    },
  }],
  ["analytics-dashboard", {
    createSeed(query) {
      return { theme: glass("#4f9c79"), data: { query, rows: ["Route A", "Route B"], measures: ["Cost", "Time", "Capacity"] },
        components: [component("hero", "hero", "Decision dashboard", { text: "Compare route options." }), component("stats", "stat-grid", "Key measures", { items: ["Cost", "Time", "Capacity"] }), component("chart", "chart", "Comparison", { series: ["Route A", "Route B"] }), component("table", "data-table", "Route options", { columns: ["Route", "Carrier"] })],
        actions: [action("filter-options", "filter", "Filter"), action("sort-options", "sort", "Sort"), action("reset-dashboard", "reset", "Reset")] };
    },
  }],
  ["workflow-builder", {
    createSeed(query) {
      return { theme: glass("#8b6dd8"), data: { query, stages: ["Match", "Compile", "Preview"], log: ["Ready"] },
        components: [component("hero", "hero", "Workflow builder", { text: "Connect a small automation flow." }), component("timeline", "timeline", "Workflow", { items: ["Match", "Compile", "Preview"] }), component("log", "activity-log", "Activity", { items: ["Ready"] }), component("chat", "chat", "Assistant", { messages: ["Describe the next step."] })],
        actions: [action("simulate-flow", "simulate", "Run workflow"), action("toggle-step", "toggle", "Pause"), action("reset-flow", "reset", "Reset")] };
    },
  }],
  ["simulation-console", {
    createSeed(query) {
      return { theme: glass("#e68b4e"), data: { query, status: "Ready", steps: 0, log: ["Simulation is ready."] },
        components: [component("hero", "hero", "Simulation console", { text: "Run a bounded process simulation." }), component("stats", "stat-grid", "System state", { items: ["Ready", "0 steps"] }), component("canvas", "canvas", "Process view", { label: "Simulation state" }), component("log", "activity-log", "Event log", { items: ["Simulation is ready."] })],
        actions: [action("simulate", "simulate", "Run step"), action("toggle", "toggle", "Pause"), action("reset", "reset", "Reset")] };
    },
  }],
  ["creative-workbench", {
    createSeed(query) {
      return { theme: glass("#d85d92"), data: { query, parameters: ["Tempo", "Mood"], output: [] },
        components: [component("hero", "hero", "Creative workbench", { text: "Transform a musical idea." }), component("canvas", "canvas", "Idea canvas", { label: "Music parameters" }), component("form", "form", "Parameters", { fields: ["Tempo", "Mood"] }), component("table", "data-table", "Translation", { columns: ["Input", "Output"] })],
        actions: [action("select-mode", "select", "Select mode"), action("translate", "calculate", "Translate"), action("reset-workbench", "reset", "Reset")] };
    },
  }],
  ["research-explorer", {
    createSeed(query) {
      return { theme: glass("#3f91b5"), data: { query, observations: ["Observation A", "Observation B"] },
        components: [component("hero", "hero", "Research explorer", { text: "Inspect focused observations." }), component("chart", "chart", "Distribution", { series: ["Observation A", "Observation B"] }), component("table", "data-table", "Observations", { columns: ["Name", "Status"] }), component("form", "form", "Explore", { fields: ["Category"] })],
        actions: [action("filter-data", "filter", "Filter"), action("sort-data", "sort", "Sort"), action("reset-data", "reset", "Reset")] };
    },
  }],
]);

export const getScaffold = (id) => SCAFFOLDS.get(id) ?? null;
