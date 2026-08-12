// Appearance settings: mode, color theme, wallpaper (saved in localStorage)
(function () {
  const STORAGE_KEY = "hm-appearance";
  const root = document.documentElement;

  const defaults = {
    mode: "light",
    theme: "teal",
    wallpaper: "aurora",
  };

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return { ...defaults, ...saved };
    } catch (error) {
      return { ...defaults };
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function applySettings(settings) {
    root.setAttribute("data-mode", settings.mode);
    root.setAttribute("data-theme", settings.theme);
    root.setAttribute("data-wallpaper", settings.wallpaper);
    saveSettings(settings);
    updateActiveButtons(settings);
  }

  function updateActiveButtons(settings) {
    document.querySelectorAll("[data-setting]").forEach((btn) => {
      const key = btn.dataset.setting;
      const value = btn.dataset.value;
      const isActive = settings[key] === value;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  const settings = loadSettings();
  applySettings(settings);

  const themeToggle = document.getElementById("theme-toggle");
  const themePanel = document.getElementById("theme-panel");

  if (themeToggle && themePanel) {
    themeToggle.addEventListener("click", function () {
      const isOpen = !themePanel.hidden;
      themePanel.hidden = isOpen;
      themeToggle.setAttribute("aria-expanded", String(!isOpen));
    });

    document.addEventListener("click", function (event) {
      if (
        themePanel.hidden ||
        themePanel.contains(event.target) ||
        themeToggle.contains(event.target)
      ) {
        return;
      }
      themePanel.hidden = true;
      themeToggle.setAttribute("aria-expanded", "false");
    });
  }

  document.querySelectorAll("[data-setting]").forEach((btn) => {
    btn.addEventListener("click", function () {
      const key = btn.dataset.setting;
      const value = btn.dataset.value;
      if (!key || !value) {
        return;
      }
      const next = { ...loadSettings(), [key]: value };
      applySettings(next);
    });
  });
})();
