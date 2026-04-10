import { getArchive, saveArchive } from "./storage.js";

function generateArchiveCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "WR-";
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function createArchivePayload(formData) {
  const language = document.documentElement.lang || "de";

  return {
    id: crypto.randomUUID(),
    archiveCode: generateArchiveCode(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activeChapterId: "chapter-1",
    language,
    profile: {
      displayName: formData.name?.trim() || "",
      mode: formData.mode || "free"
    },
    archive: {
      title: formData.name?.trim() || "Mein Lebensarchiv",
      firstEntry: formData.firstEntry?.trim() || ""
    },
    chapters: [
      {
        id: "chapter-1",
        title: "Der Anfang",
        type: formData.mode || "free",
        entries: formData.firstEntry?.trim()
          ? [
              {
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                kind: "text",
                content: formData.firstEntry.trim()
              }
            ]
          : []
      }
    ]
  };
}

function handleStartPage() {
  const form = document.querySelector("[data-start-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = form.querySelector("[name='displayName']")?.value || "";
    const mode = form.querySelector("[name='mode']")?.value || "free";
    const firstEntry = form.querySelector("[name='firstEntry']")?.value || "";

    const payload = createArchivePayload({ name, mode, firstEntry });
    const ok = saveArchive(payload);

    if (!ok) {
      alert("Das Archiv konnte lokal nicht gespeichert werden.");
      return;
    }

    window.location.href = "archiv.html";
  });
}

function getActiveChapter(data) {
  if (!Array.isArray(data.chapters) || data.chapters.length === 0) {
    data.chapters = [
      {
        id: "chapter-1",
        title: "Der Anfang",
        type: data.profile?.mode || "free",
        entries: []
      }
    ];
    data.activeChapterId = "chapter-1";
    saveArchive(data);
  }

  const activeId = data.activeChapterId || data.chapters[0].id;
  return (
    data.chapters.find((chapter) => chapter.id === activeId) || data.chapters[0]
  );
}

function getChapterContent(chapter) {
  return chapter?.entries?.[0]?.content || "";
}

function getDefaultChapterTitle(data) {
  const nextNumber = (data.chapters?.length || 0) + 1;
  return `Kapitel ${nextNumber}`;
}

function formatChapterList(data) {
  if (!Array.isArray(data.chapters) || data.chapters.length <= 1) return "";

  return `
    <div style="margin-top:18px; position:relative;">
      <details id="chapterListDetails">
        <summary
          style="
            list-style:none;
            cursor:pointer;
            font:inherit;
            color:var(--text);
            border:1px solid rgba(255,255,255,0.10);
            border-radius:12px;
            padding:10px 12px;
            background:rgba(0,0,0,0.10);
            user-select:none;
          "
        >
          Vorhandene Kapitel
        </summary>

        <div
          style="
            position:absolute;
            left:0;
            right:0;
            bottom:calc(100% + 10px);
            display:grid;
            gap:8px;
            padding:12px;
            border:1px solid rgba(255,255,255,0.10);
            border-radius:14px;
            background:rgba(8, 14, 24, 0.96);
            backdrop-filter:blur(8px);
            box-shadow:0 12px 30px rgba(0,0,0,0.28);
            z-index:20;
          "
        >
          ${data.chapters
            .map((chapter) => {
              const isActive = chapter.id === data.activeChapterId;
              return `
                <button
                  type="button"
                  class="chapter-switch"
                  data-chapter-id="${escapeHtml(chapter.id)}"
                  style="
                    text-align:left;
                    font:inherit;
                    color:var(--text);
                    background:${isActive ? "rgba(195,154,91,0.16)" : "rgba(0,0,0,0.14)"};
                    border:1px solid rgba(255,255,255,0.10);
                    border-radius:12px;
                    padding:10px 12px;
                    cursor:pointer;
                  "
                >
                  ${escapeHtml(chapter.title || "Unbenannt")}
                </button>
              `;
            })
            .join("")}
        </div>
      </details>
    </div>
  `;
}
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function renderGuidedPromptsAccordion() {
  const sections = [
    {
      id: "identity",
      title: "Identität",
      prompts: [
        "Wer bist du – unabhängig von Rollen und Erwartungen?",
        "Was macht dich im Kern aus?",
        "Wofür stehst du?",
        "Was war dir immer wichtig?",
        "Was hat dich innerlich getragen?",
        "Wie würdest du dich selbst beschreiben?"
      ]
    },
    {
      id: "life",
      title: "Leben",
      prompts: [
        "Welche Momente haben dich geprägt?",
        "Was waren Wendepunkte in deinem Leben?",
        "Worauf bist du stolz?",
        "Was hat dich herausgefordert?",
        "Was würdest du heute anders sehen?",
        "Welche Erfahrungen haben dich verändert?"
      ]
    },
    {
      id: "unsaid",
      title: "Ungesagtes",
      prompts: [
        "Was wurde nie gesagt?",
        "Wem wolltest du etwas sagen, hast es aber nie getan?",
        "Gibt es etwas, das du loslassen möchtest?",
        "Gibt es etwas, das dich bis heute begleitet?",
        "Was hättest du gerne früher ausgesprochen?",
        "Gibt es etwas, das offen geblieben ist?"
      ]
    },
    {
      id: "legacy",
      title: "Vermächtnis",
      prompts: [
        "Was soll von dir bleiben?",
        "Was sollen andere über dich wissen?",
        "Welche Botschaft möchtest du hinterlassen?",
        "Was möchtest du weitergeben?",
        "Woran sollen sich andere erinnern?",
        "Was ist dir wirklich wichtig gewesen?"
      ]
    }
  ];

  return `
    <div style="display:grid; gap:10px; margin-top:18px;">
      ${sections
        .map(
          (section) => `
            <details
              style="
                border:1px solid rgba(255,255,255,0.10);
                border-radius:14px;
                background:rgba(0,0,0,0.10);
                overflow:hidden;
              "
            >
              <summary
                style="
                  list-style:none;
                  cursor:pointer;
                  padding:12px 14px;
                  font:inherit;
                  color:var(--text);
                  outline:none;
                "
              >
                ${escapeHtml(section.title)}
              </summary>

              <div style="padding:0 14px 14px; display:grid; gap:8px;">
                ${section.prompts
                  .map(
                    (prompt) => `
                      <div style="color:var(--muted); line-height:1.4;">
                        ${escapeHtml(prompt)}
                      </div>
                    `
                  )
                  .join("")}
              </div>
            </details>
          `
        )
        .join("")}
    </div>
  `;
}

function renderArchivePage() {
  const root = document.querySelector("[data-archive-root]");
  if (!root) return;

  const data = getArchive();

  if (!data) {
    root.innerHTML = `
      <div class="empty-state">
        <h2>Kein Archiv gefunden.</h2>
        <p>Bitte beginne zuerst auf der Startseite.</p>
        <a class="btn btn-primary" href="start.html">Zur Startseite</a>
      </div>
    `;
    return;
  }

  const displayName = data.profile?.displayName || "Mein Archiv";
  const modeLabel =
    data.profile?.mode === "guided" ? "Geführter Beginn" : "Freier Beginn";
  const isGuided = data.profile?.mode === "guided";

  const activeChapter = getActiveChapter(data);
  const activeContent = getChapterContent(activeChapter);
  const currentChapterTitle = activeChapter?.title || "Der Anfang";

  const chapterListHtml = formatChapterList(data);

  const rightBoxContent = isGuided
    ? `
      <div class="eyebrow">Geführte Aufnahme</div>
      <h2>Nächster Schritt</h2>
      <p class="archive-copy">
        Du kannst dich an einzelnen Impulsen orientieren oder frei formulieren. Die Führung bleibt eine Hilfe, keine Vorgabe.
      </p>

      ${renderGuidedPromptsAccordion()}

      <p class="archive-copy" style="margin-top:18px;">
        Aktuelles Kapitel: ${escapeHtml(currentChapterTitle)}
      </p>

      <div class="actions" style="margin-top:16px;">
        <button class="btn btn-primary" id="saveAsChapterBtn" type="button">Als Kapitel speichern</button>
        <button class="btn btn-primary" id="newChapterBtn" type="button">Neues Kapitel</button>
      </div>

      ${chapterListHtml}
    `
    : `
      <div class="eyebrow">Struktur</div>
      <h2>Aktueller Stand</h2>
      <p class="archive-copy">
        Du arbeitest frei. Weitere Kapitel und Struktur kannst du später ergänzen, ohne den begonnenen Text zu verändern.
      </p>

      <p class="archive-copy" style="margin-top:18px;">
        Aktuelles Kapitel: ${escapeHtml(currentChapterTitle)}
      </p>

      <div class="actions" style="margin-top:16px;">
        <button class="btn btn-primary" id="saveAsChapterBtn" type="button">Als Kapitel speichern</button>
        <button class="btn btn-primary" id="newChapterBtn" type="button">Neues Kapitel</button>
      </div>

      ${chapterListHtml}
    `;

  root.innerHTML = `
    <section class="archive-shell">
      <div class="archive-head">
        <div class="eyebrow">Archiv</div>
        <h1>${escapeHtml(displayName)}</h1>

        <p class="archive-meta">
          ${escapeHtml(modeLabel)} · erstellt ${formatDate(data.createdAt)} · Code <span id="archiveCode">${escapeHtml(data.archiveCode || "")}</span>
        </p>

        <p style="margin-top:8px; font-size:0.85rem; color:rgba(241,238,232,0.6);">
          Bitte notiere deinen Archivcode. Kein Zugriff ohne Code.
        </p>

        <div style="margin-top:8px;">
          <button
            id="copyCodeBtn"
            type="button"
            style="font-size:0.8rem; background:none; border:1px solid rgba(255,255,255,0.2); color:rgba(241,238,232,0.7); padding:4px 8px; border-radius:6px; cursor:pointer;"
          >
            Code kopieren
          </button>
        </div>
      </div>

      <div class="archive-grid">
        <article class="archive-card">
          <div class="eyebrow"></div>

          <h2 style="margin:0 0 8px;">Der Anfang</h2>

          <p class="archive-copy">
            ${activeContent ? "Dieses Kapitel enthält bereits einen gespeicherten Eintrag." : "Hier beginnt dein Archiv. Du kannst frei schreiben oder Schritt für Schritt geführt werden."}
          </p>

          <label class="field">
            <span class="field-label">Dein Eintrag</span>
            <textarea id="chapterEntry" placeholder="Schreibe hier weiter ...">${escapeHtml(activeContent)}</textarea>
          </label>

          <div class="actions">
            <button class="btn btn-primary" id="saveEntryBtn" type="button">Speichern</button>
          </div>
        </article>

        <aside class="archive-card">
          ${rightBoxContent}
        </aside>
      </div>
    </section>
  `;

  const saveBtn = document.getElementById("saveEntryBtn");
  const copyCodeBtn = document.getElementById("copyCodeBtn");
  const archiveCode = document.getElementById("archiveCode");
  const saveAsChapterBtn = document.getElementById("saveAsChapterBtn");
  const newChapterBtn = document.getElementById("newChapterBtn");
  const chapterSwitchButtons = document.querySelectorAll(".chapter-switch");
  const textArea = document.getElementById("chapterEntry");

  copyCodeBtn?.addEventListener("click", async () => {
    if (!archiveCode) return;

    try {
      await navigator.clipboard.writeText(archiveCode.textContent || "");
      copyCodeBtn.textContent = "Kopiert";
      setTimeout(() => {
        copyCodeBtn.textContent = "Code kopieren";
      }, 1200);
    } catch {
      copyCodeBtn.textContent = "Nicht möglich";
      setTimeout(() => {
        copyCodeBtn.textContent = "Code kopieren";
      }, 1200);
    }
  });

  saveBtn?.addEventListener("click", () => {
    const updated = getArchive();
    if (!updated) return;

    const active = getActiveChapter(updated);
    const content = textArea.value.trim();

    updated.updatedAt = new Date().toISOString();
    updated.archive.firstEntry = content;
    active.entries = content
      ? [
          {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            kind: "text",
            content
          }
        ]
      : [];

    saveArchive(updated);
    saveBtn.textContent = "Gespeichert";
    setTimeout(() => {
      saveBtn.textContent = "Speichern";
    }, 1200);
  });

  saveAsChapterBtn?.addEventListener("click", () => {
    const updated = getArchive();
    if (!updated) return;

    const active = getActiveChapter(updated);
    const content = textArea.value.trim();

    const enteredTitle = window.prompt("Kapitel benennen:");
    const finalTitle = enteredTitle?.trim() || getDefaultChapterTitle(updated);

    updated.updatedAt = new Date().toISOString();
    active.title = finalTitle;
    active.entries = content
      ? [
          {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            kind: "text",
            content
          }
        ]
      : [];

    if (updated.activeChapterId === updated.chapters[0]?.id) {
      updated.archive.firstEntry = content;
    }

    saveArchive(updated);
    renderArchivePage();
  });

  newChapterBtn?.addEventListener("click", () => {
    const updated = getArchive();
    if (!updated) return;

    const newIndex = (updated.chapters?.length || 0) + 1;
    const newChapter = {
      id: crypto.randomUUID(),
      title: `Kapitel ${newIndex}`,
      type: updated.profile?.mode || "free",
      entries: []
    };

    if (!Array.isArray(updated.chapters)) {
      updated.chapters = [];
    }

    updated.chapters.push(newChapter);
    updated.activeChapterId = newChapter.id;
    updated.updatedAt = new Date().toISOString();

    saveArchive(updated);
    renderArchivePage();
  });

chapterSwitchButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const updated = getArchive();
    if (!updated) return;

    updated.activeChapterId = button.dataset.chapterId;
    saveArchive(updated);

    const details = document.getElementById("chapterListDetails");
    if (details) {
      details.open = false;
    }

    renderArchivePage();
  });
});
}

document.addEventListener("DOMContentLoaded", () => {
  handleStartPage();
  renderArchivePage();
});
