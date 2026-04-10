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
        title: "Kapitel 1",
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
  const firstEntry = data.archive?.firstEntry || "";
  const modeLabel =
    data.profile?.mode === "guided" ? "Geführter Beginn" : "Freier Beginn";

  root.innerHTML = `
    <section class="archive-shell">
      <div class="archive-head">
        <div class="eyebrow">Archiv</div>
        <h1>${escapeHtml(displayName)}</h1>
       <p class="archive-meta">
  ${escapeHtml(modeLabel)} · erstellt ${formatDate(data.createdAt)} · Code 
  <span id="archiveCode">${escapeHtml(data.archiveCode || "")}</span>
</p>

<div style="margin-top:6px;">
  <button id="copyCodeBtn" style="
    font-size:0.8rem;
    background:none;
    border:1px solid rgba(255,255,255,0.2);
    color:rgba(241,238,232,0.7);
    padding:4px 8px;
    border-radius:6px;
    cursor:pointer;
  ">
    Code kopieren
  </button>
</div>

<p style="margin-top:6px; font-size:0.85rem; color:rgba(241,238,232,0.6);">
  Bitte notiere deinen Archivcode sicher. Ohne Code kein Zugriff mehr möglich.
</p>
      </div>

      <div class="archive-grid">
        <article class="archive-card">
          <div class="eyebrow">Kapitel 1</div>
          <h2>Der Anfang</h2>
          <p class="archive-copy">
            ${firstEntry ? "Dein erster Eintrag ist bereits gespeichert." : "Hier beginnt dein Archiv. Du kannst frei schreiben oder Schritt für Schritt geführt werden."}
          </p>

          <label class="field">
            <span class="field-label">Dein Eintrag</span>
            <textarea id="chapterEntry" placeholder="Schreibe hier weiter ...">${escapeHtml(firstEntry)}</textarea>
          </label>

         <div class="actions">
  <button class="btn btn-primary" id="saveEntryBtn" type="button">Speichern</button>
  
</div>
        </article>

        <aside class="archive-card">
          <div class="eyebrow">Nächster Schritt</div>
          <h2>Struktur</h2>
          <p class="archive-copy">
            Als Nächstes bauen wir Kapitel, Audio, Zugriffsregeln und spätere Freigaben auf.
          </p>
        </aside>
      </div>
    </section>
  `;

  const saveBtn = document.getElementById("saveEntryBtn");
  const textArea = document.getElementById("chapterEntry");

  saveBtn?.addEventListener("click", () => {
    const updated = getArchive();
    if (!updated) return;

    const content = textArea.value.trim();
    updated.updatedAt = new Date().toISOString();
    updated.archive.firstEntry = content;
    updated.chapters[0].entries = content
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

document.addEventListener("DOMContentLoaded", () => {
  handleStartPage();
  renderArchivePage();
});
