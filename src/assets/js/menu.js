// Öffnet und schließt das Handy-Menü (ersetzt das WordPress-Skript).
document.querySelectorAll(".wp-block-navigation").forEach((nav) => {
  const container = nav.querySelector(".wp-block-navigation__responsive-container");
  const oeffnen = nav.querySelector(".wp-block-navigation__responsive-container-open");
  const schliessen = nav.querySelector(".wp-block-navigation__responsive-container-close");
  const dialog = nav.querySelector(".wp-block-navigation__responsive-dialog");
  if (!container || !oeffnen || !schliessen) return;

  const setze = (offen) => {
    container.classList.toggle("is-menu-open", offen);
    container.classList.toggle("has-modal-open", offen);
    document.documentElement.classList.toggle("has-modal-open", offen);
    if (dialog) {
      dialog.setAttribute("aria-modal", offen ? "true" : "false");
      dialog.setAttribute("role", offen ? "dialog" : "");
    }
    (offen ? schliessen : oeffnen).focus();
  };
  oeffnen.addEventListener("click", () => setze(true));
  schliessen.addEventListener("click", () => setze(false));
  container.addEventListener("keydown", (e) => { if (e.key === "Escape") setze(false); });
});
