# Portfolio Website and Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the retro desktop portfolio website into Yash Kalani's personal site at `yash.kalani.name`, integrating his resume, a prettier internal links profile landing page at `/profiles`, a routing integration for `flashcard-review` at `/flashcards`, and an internal file explorer showcasing the App Forge codebase.

**Architecture:** 
1. **Resume Integration**: Copy the physical PDF resume into `assets/Yash_Kalani_Resume-AI.pdf` and update `content.js` with structured resume data.
2. **Prettier Link Profiles**: Build a standalone responsive HTML/CSS landing page for `/profiles` resembling a premium link directory (styled with retro/neon elements compatible with the desktop shell), served by Node.js.
3. **Flashcards Routing**: Map `/flashcards` and `/static/*` routes in Node.js to load the `flashcard-review` static files, and proxy all non-AppForge `/api/*` endpoints to the Python Flask backend running on port 5000.
4. **App Forge Explorer**: Build an interactive project folder visualizer window inside `app.js` that allows visitors to browse the portfolio's main files (e.g. `app.js`, `server.js`) inside the retro desktop UI.

**Tech Stack:** Node.js (Vanilla HTTP Server), HTML5, Vanilla CSS, Vanilla JS, Python/Flask (for Flashcard backend integration).

## Global Constraints

- Domain target is `yash.kalani.name`.
- Use OKLCH for any new color palettes (e.g. on the profiles page).
- Contrast ratio must remain >= 4.5:1 for body copy.
- Animation z-index must conform to: dropdown (100) -> sticky (200) -> window (500) -> toast/tooltip (1000).
- All filenames/links inside code must use Windows/Unix relative paths as appropriate.

---

## Task 1: Copy Resume and Update Content Metadata

**Files:**
- Create: `assets/Yash_Kalani_Resume-AI.pdf` (Copy of `C:\Users\yash\cse\Job_apps\Yash_Kalani_Resume-AI.pdf`)
- Modify: `content.js`

**Interfaces:**
- Consumes: Resume PDF file and OCR extracted contents.
- Produces: Updated export object `portfolio` in `content.js` containing Yash Kalani's name, email, education, experience, and project highlights.

- [ ] **Step 1: Copy the resume PDF into the assets folder**
  Copy the file from `C:\Users\yash\cse\Job_apps\Yash_Kalani_Resume-AI.pdf` to `C:\Users\yash\cse\proj\portfolio\assets\Yash_Kalani_Resume-AI.pdf`.
  Verify the file is successfully copied and readable by listing `assets/`.

- [ ] **Step 2: Update content.js metadata**
  Open `content.js` and modify the fields for name, role, email, experiences, projects, and resume to match Yash Kalani's actual resume information.
  ```javascript
  export const portfolio = {
    name: "Yash Kalani",
    role: "AI/ML & Product Engineer",
    tagline: "Building agentic AI tools and high-craft interfaces.",
    email: "kalaniya@msu.edu",
    location: "East Lansing, MI",
    github: "https://github.com/ykalani",
    linkedin: "https://www.linkedin.com/in/ykalani/",
    launcher: {
      title: "Project Registry",
      subtitle: "Search any of my past engineering projects to spin up a sandboxed prototype container.",
      placeholder: "Search: AutoSched, logistics, music translator...",
      examples: [
        { label: "AutoSched", query: "AutoSched Syllabi Extractor" },
        { label: "Music Translator", query: "AI-Driven Music Translation Platform" },
        { label: "Logistics Analysis", query: "Michigan Logistics Case Study" },
      ],
    },
    startMenu: [
      { id: "about", label: "About Me", icon: "user" },
      { id: "projects", label: "Projects", icon: "code" },
      { id: "experience", label: "Experience", icon: "briefcase" },
      { id: "contact", label: "Contact", icon: "mail" },
      { id: "resume", label: "Resume", icon: "file" },
      { id: "settings", label: "Theme Settings", icon: "sliders" },
    ],
    // Windows list stays structured...
    about: {
      summary: "I build agentic AI pipelines, LLM evaluation frameworks, and highly polished interfaces. I study Computer Science and Computational Math (AI focus) at Michigan State University.",
      highlights: [
        "Agentic AI & Tool-calling architectures (AWS Bedrock, MCP)",
        "LLM Evaluation & LLM-as-a-judge frameworks",
        "Data engineering & Spark processing (Databricks, PySpark, Delta Lake)",
      ],
      quickStart: [
        "Open the Start menu or desktop icons to explore.",
        "Launch 'Resume' to view or download my official PDF resume.",
        "Check out the 'App Forge' or type a prompt to generate custom windows."
      ],
      stats: [
        { label: "University", value: "Michigan State University" },
        { label: "Graduation", value: "Expected May 2027" },
        { label: "AI Club Role", value: "Workshop Coordinator" }
      ]
    },
    projects: [
      {
        title: "AutoSched",
        description: "Web-based application allowing students to upload syllabi/screenshots to extract lectures, exams, and sync to Google Calendar. 1st Place @ Code Green Hackathon.",
        tags: ["React", "OpenAI API", "Tesseract OCR", "Google Calendar API"]
      },
      {
        title: "Michigan Logistics Case Study",
        description: "Used XGBoost and Pandas to analyze routes and recommend multi-carrier optimizations. 1st Place @ Broad Datathon.",
        tags: ["Python", "Pandas", "Matplotlib", "XGBoost", "Power BI"]
      },
      {
        title: "AI-Driven Music Translation Platform",
        description: "Python compiler translating musical parameters into Ruby code; RESTful API connecting frontend to dockerized audio runtime.",
        tags: ["Next.js", "FastAPI", "Python", "Docker", "Monaco Editor", "Ruby"]
      }
    ],
    experience: [
      {
        role: "AI/ML Engineer Intern",
        company: "GE Aerospace",
        period: "May 2026 - Aug 2026",
        details: "Architected agentic AI tool-calling pipelines on Bedrock integrating MCP servers. Built LLM-as-a-judge evaluation frameworks. Developed Databricks ingestion pipelines."
      },
      {
        role: "AI/ML Research Intern",
        company: "Facility for Rare Isotope Beams (FRIB)",
        period: "Aug 2025 - Present",
        details: "Implemented MCMC algorithm reducing false positives by 23%. Developed ResNet classification model using PyTorch."
      },
      {
        role: "AI/ML Engineer Intern",
        company: "American Axle & Manufacturing",
        period: "July 2025 - Aug 2025",
        details: "Developed Ignition-based analytics application using Python. Cleaned raw data. Integrated Dell Technologies APIs."
      },
      {
        role: "Business Automation Intern",
        company: "DTE Energy",
        period: "May 2025 - July 2025",
        details: "Developed SWICenter using Microsoft Power Apps and Power Automate. Built AI-powered SharePoint Agent."
      }
    ],
    contact: {
      intro: "Let's connect! Reach out via email or check my active profiles below.",
      fields: [
        { label: "Email", value: "kalaniya@msu.edu", href: "mailto:kalaniya@msu.edu" },
        { label: "LinkedIn", value: "linkedin.com/in/ykalani", href: "https://linkedin.com/in/ykalani" },
        { label: "GitHub", value: "ykalani", href: "https://github.com/ykalani" }
      ]
    },
    resume: {
      summary: "Yash Kalani - Computer Science Student & AI/ML Engineer. Click the link below to view/download the full official PDF resume.",
      bullets: [
        "BS in Computer Science, Minor in Computational Math (AI) at MSU",
        "Expertise in Agentic AI, LLM pipelines, PySpark, PyTorch, and React",
        "Multiple hackathon/datathon wins (1st @ Code Green, 1st @ Broad)"
      ],
      pdfUrl: "./assets/Yash_Kalani_Resume-AI.pdf"
    }
  };
  ```

- [ ] **Step 3: Run sanity verification script**
  Create a temporary node script `scratch/verify_content.js` to ensure `content.js` exports successfully.
  Run: `node scratch/verify_content.js`
  Expected: Content parsed successfully with Yash Kalani's metadata.

- [ ] **Step 4: Commit**
  ```bash
  git add assets/Yash_Kalani_Resume-AI.pdf content.js
  git commit -m "feat: copy resume PDF and update content.js with Yash Kalani's profile data"
  ```

---

## Task 2: Implement Standalone Prettier Profiles Page

**Files:**
- Create: `profiles.html`
- Create: `profiles.css`
- Modify: `server.js`

**Interfaces:**
- Consumes: The extracted 14 profile URLs.
- Produces: A beautiful standalone /profiles HTML/CSS page served on request.

- [ ] **Step 1: Create profiles.html**
  Design a beautiful mobile-responsive page featuring Yash's profile photo (from the AllMyLinks avatar: `https://cdn.allmylinks.com/prod/User/photo/I/O/E/hCw6nOY8qrYV3Z72VpcyL0E-sncAFfJ4.jpg`), name, short bio, and the 14 links designed as gorgeous retro Windows-beveled button rows or neon/cyberpunk chips depending on the active theme.
  Ensure it links to `profiles.css`.

- [ ] **Step 2: Create profiles.css**
  Implement the styles using OKLCH and matching the retro/beveled style of the main portfolio but fully optimized as a vertical link directory. Add subtle hover micro-animations and respect reduced motion query.

- [ ] **Step 3: Route the page in server.js**
  Open `server.js` and add a route matcher to serve `/profiles`:
  ```javascript
  // Around line 194 of server.js:
  let requestPath = req.url.split("?")[0];
  if (requestPath === "/profiles" || requestPath === "/profiles/") {
    requestPath = "/profiles.html";
  } else if (requestPath === "/") {
    requestPath = "/index.html";
  }
  const filePath = path.join(root, requestPath);
  ```

- [ ] **Step 4: Run server and verify profiles**
  Run: `npm run dev` (or `node server.js`)
  Test: Make a request to `http://127.0.0.1:4173/profiles` using a script or command to verify it returns `profiles.html`.

- [ ] **Step 5: Commit**
  ```bash
  git add profiles.html profiles.css server.js
  git commit -m "feat: add standalone beautiful profiles page and server routing"
  ```

---

## Task 3: Integrate Flashcards Routing and Proxying

**Files:**
- Modify: `server.js`

**Interfaces:**
- Consumes: `/flashcards` request path, `/static/` files of flashcard-review, and proxying to Flask API.
- Produces: Integrated endpoint access on the main server.

- [ ] **Step 1: Implement static route redirecting and file serving for flashcards**
  In `server.js`, inspect incoming paths.
  If the route is `/flashcards` or `/flashcards/`, serve the `index.html` from the `flashcard-review/templates/` folder.
  If the route is `/static/app.js` or `/static/style.css`, serve them from `flashcard-review/static/`.
  
  ```javascript
  // In server.js file resolution:
  let requestPath = req.url.split("?")[0];
  let filePath;

  if (requestPath === "/flashcards" || requestPath === "/flashcards/") {
    filePath = path.join(root, "../flashcard-review/templates/index.html");
  } else if (requestPath.startsWith("/static/")) {
    filePath = path.join(root, "../flashcard-review", requestPath);
  } else {
    if (requestPath === "/profiles" || requestPath === "/profiles/") {
      requestPath = "/profiles.html";
    } else if (requestPath === "/") {
      requestPath = "/index.html";
    }
    filePath = path.join(root, requestPath);
  }
  ```

- [ ] **Step 2: Add API proxying inside server.js**
  All `/api/` calls (except `/api/forge`) should be proxied to the Python Flask backend running on `http://127.0.0.1:5000`.
  Implement a request proxying routine in Node:
  ```javascript
  if (req.url.startsWith("/api/") && req.url !== "/api/forge") {
    // Proxy request to Python backend
    const targetUrl = `http://127.0.0.1:5000${req.url}`;
    const proxyReq = http.request(targetUrl, {
      method: req.method,
      headers: req.headers
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });
    req.pipe(proxyReq, { end: true });
    return;
  }
  ```

- [ ] **Step 3: Test flashcards integration**
  Start `server.js`.
  Curl `http://127.0.0.1:4173/flashcards` and verify it serves the flashcard template content.
  Verify that `/static/app.js` resolves correctly to the flashcard static bundle.

- [ ] **Step 4: Commit**
  ```bash
  git add server.js
  git commit -m "feat: add flashcards routing and API proxying to flask server"
  ```

---

## Task 4: App Forge Project Explorer and Desktop Updates

**Files:**
- Modify: `app.js`

**Interfaces:**
- Consumes: Updated `portfolio` definitions in `content.js` and local file tree.
- Produces: Functional project codebase explorer and resume download links within the desktop UI.

- [ ] **Step 1: Build the File Explorer component and display it in the shell**
  In `app.js`, add a new window definition for `app-forge-explorer`.
  Map it to a desktop shortcut icon and the start menu.
  Write a visual file explorer view rendering a sidebar file tree (`index.html`, `app.js`, `server.js`, `content.js`, `generator.js`, `styles.css`) and a viewport window that shows a syntax-highlighted or clean code box containing the source of each file (read statically or hardcoded as neat readable modules).
  
- [ ] **Step 2: Update Resume window rendering**
  In `app.js`, update the "Resume" window template to feature a direct download link matching `portfolio.resume.pdfUrl` with a retro floppy-disk icon.

- [ ] **Step 3: Run browser validation checks**
  Launch the local dev server. Use Playwright / browser tools to verify that the desktop UI renders correctly, the File Explorer opens files, the Resume PDF downloads correctly, and theme settings function properly.

- [ ] **Step 4: Commit**
  ```bash
  git add app.js
  git commit -m "feat: implement App Forge project codebase explorer and resume window update"
  ```
