export const portfolio = {
  name: "Your Name",
  role: "AI-augmented Product Engineer",
  tagline: "Retro interface, modern shipping discipline.",
  email: "hello@yourdomain.dev",
  location: "Remote",
  github: "https://github.com/yourname",
  linkedin: "https://www.linkedin.com/in/yourname/",
  launcher: {
    title: "Project Registry",
    subtitle: "Search any of my past engineering projects to spin up a sandboxed prototype container.",
    placeholder: "Search: producer consumer, chat client, pixel painter, database...",
    examples: [
      { label: "Producer-Consumer", query: "Multi-Threaded Producer-Consumer Simulator" },
      { label: "Pixel Painter", query: "3D Pixel Canvas Editor" },
      { label: "Cassette Synth", query: "Vintage Cassette Synth Player" },
      { label: "Doppler Weather", query: "Weather Doppler Forecast Lookup" },
      { label: "Chat Protocol", query: "Decentralized Chat Protocol Client" },
    ],
  },
  startMenu: [
    { id: "about", label: "About Me", icon: "user" },
    { id: "projects", label: "Projects", icon: "code" },
    { id: "experience", label: "Experience", icon: "briefcase" },
    { id: "contact", label: "Contact", icon: "mail" },
    { id: "resume", label: "Resume", icon: "file" },
  ],
  windows: [
    {
      id: "about",
      label: "About",
      glyph: "user",
      title: "About Me",
      type: "about",
      x: 56,
      y: 72,
      width: 420,
      height: 340,
      openByDefault: false,
    },
    {
      id: "projects",
      label: "Projects",
      glyph: "code",
      title: "Selected Projects",
      type: "projects",
      x: 500,
      y: 64,
      width: 470,
      height: 380,
      openByDefault: false,
    },
    {
      id: "experience",
      label: "Experience",
      glyph: "briefcase",
      title: "Experience",
      type: "experience",
      x: 96,
      y: 420,
      width: 430,
      height: 340,
      openByDefault: false,
    },
    {
      id: "contact",
      label: "Contact",
      glyph: "mail",
      title: "Contact",
      type: "contact",
      x: 540,
      y: 424,
      width: 420,
      height: 320,
      openByDefault: false,
    },
    {
      id: "resume",
      label: "Resume",
      glyph: "file",
      title: "Resume",
      type: "resume",
      x: 980,
      y: 96,
      width: 380,
      height: 280,
      openByDefault: false,
    },
  ],
  about: {
    summary:
      "I build polished interfaces, shape product stories, and keep the engineering bar high enough that the work ships cleanly the first time.",
    highlights: [
      "Design systems and interface architecture",
      "Fast frontends with careful motion and accessibility",
      "Practical AI features with strong product boundaries",
    ],
    quickStart: [
      "Open the Start menu or desktop icons to launch windows.",
      "Drag windows by the title bar on larger screens.",
      "Use the taskbar buttons to focus or minimize windows.",
      "Open Contact to copy the email or launch your mail app.",
    ],
    stats: [
      { label: "Focus", value: "Frontend + product" },
      { label: "Style", value: "Retro / tactile / clear" },
      { label: "Goal", value: "Ship memorable tools" },
    ],
  },
  projects: [
    {
      title: "Retro Desktop Portfolio",
      description:
        "A browser-based Windows-style shell with draggable windows, a taskbar, and content-driven panels.",
      tags: ["HTML", "CSS", "Vanilla JS"],
    },
    {
      title: "AI Concierge Shell",
      description:
        "A safe assistant layer that routes prompts through a backend, keeps secrets server-side, and returns trimmed answers.",
      tags: ["API", "Prompting", "Model routing"],
    },
    {
      title: "Component Kit",
      description:
        "A reusable UI kit with window chrome, menu states, and theme tokens built for rapid iteration.",
      tags: ["Design system", "Tokens", "Accessibility"],
    },
  ],
  experience: [
    {
      role: "Frontend Engineer",
      company: "Your Company",
      period: "2024 - Present",
      details:
        "Built responsive product surfaces, aligned product and engineering, and shipped interfaces that felt fast and intentional.",
    },
    {
      role: "Builder",
      company: "Independent",
      period: "2022 - 2024",
      details:
        "Prototyped portfolio sites, internal tools, and AI-assisted workflows with a strong bias toward practical implementation.",
    },
    {
      role: "Interface Explorer",
      company: "Always",
      period: "Now",
      details:
        "Learning from retro desktop metaphors, operating-system UX, and the small details that make software feel alive.",
    },
  ],
  contact: {
    intro:
      "Send a note if you want to talk design systems, AI products, or making a portfolio feel like a tiny operating system.",
    fields: [
      { label: "Email", value: "hello@yourdomain.dev", href: "mailto:hello@yourdomain.dev" },
      { label: "GitHub", value: "yourname", href: "https://github.com/yourname" },
      { label: "LinkedIn", value: "yourname", href: "https://www.linkedin.com/in/yourname/" },
    ],
  },
  resume: {
    summary:
      "A compact, editable summary window. Replace these bullets with your actual resume highlights or link a PDF once you have one.",
    bullets: [
      "Frontend and product engineering",
      "Accessible, responsive interfaces",
      "AI features with sensible architecture",
    ],
  },
};
