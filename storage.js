const STORAGE_KEY = "whatremains_archive_v1";

export function getArchive() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Archive load failed:", err);
    return null;
  }
}

export function saveArchive(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error("Archive save failed:", err);
    return false;
  }
}

export function clearArchive() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (err) {
    console.error("Archive clear failed:", err);
    return false;
  }
}