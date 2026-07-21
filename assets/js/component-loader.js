const componentSlots = document.querySelectorAll("[data-component]");

async function loadComponent(slot) {
  const name = slot.dataset.component;
  const response = await fetch(`components/${name}.html`);

  if (!response.ok) {
    throw new Error(`Không thể tải component: ${name}`);
  }

  const template = document.createElement("template");
  template.innerHTML = (await response.text()).trim();
  slot.replaceWith(template.content);
}

function initializeNavigation() {
  const menuToggle = document.querySelector("#menu-toggle");
  const header = document.querySelector(".site-header");

  const updateHeaderState = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  window.addEventListener("scroll", updateHeaderState, { passive: true });
  updateHeaderState();

  document.querySelectorAll(".mobile-drawer a").forEach((link) => {
    link.addEventListener("click", () => {
      if (menuToggle) menuToggle.checked = false;
    });
  });

  if (location.hash) {
    const targetId = location.hash.slice(1);

    requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView();
    });
  }
}

Promise.all([...componentSlots].map(loadComponent))
  .then(initializeNavigation)
  .catch((error) => {
    console.error(error);
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<p class="component-error">Không thể nạp giao diện. Hãy chạy website qua local server.</p>',
    );
  });
