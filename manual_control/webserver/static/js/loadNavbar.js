const navItems = {
  "Typing Mode": "/",
  "Display Mode": "/display",
  "Game Mode": "/game",
}

const constructNavbar = (items) => {
  let links = [];

  for (const [key, value] of Object.entries(items)) {
    if (window.location.href.split("/").at(-1).split(".")[0] === key.split(" ")[0].toLowerCase()) {
      links.push(`<a class="tab-link--active tab-link" href="${value}">${key}</a>`);
    } else {
      links.push(`<a class="tab-link" href="${value}">${key}</a>`);
    }
  }

  return `<nav class="menu-bar">
    <ul class="tab-list">
      <li class="tab-item">
        ${links.join("\n")}
      </li>
    </ul>
  </nav>`
};

const navbar = constructNavbar(navItems);

$("document").ready(() => {
  $(".title").after(navbar);
});