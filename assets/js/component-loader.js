const componentSlots = document.querySelectorAll("[data-component]");

async function loadComponent(slot) {
  const name = slot.dataset.component;
  const response = await fetch(`components/${name}.html`, { cache: "no-store" });

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

function initializeHeroCarousel() {
  const hero = document.querySelector(".hero");
  const track = hero?.querySelector(".hero-track");
  const slides = [...(hero?.querySelectorAll(".hero-slide") ?? [])];
  const dots = [...(hero?.querySelectorAll(".hero-dots button") ?? [])];

  if (!hero || !track || slides.length < 2) return;

  let activeIndex = 0;
  let startX = 0;
  let dragX = 0;
  let dragging = false;
  let autoplayId;

  const render = (animate = true) => {
    track.classList.toggle("is-dragging", !animate);
    track.style.transform = `translate3d(${-activeIndex * 100}%, 0, 0)`;

    slides.forEach((slide, index) => {
      const active = index === activeIndex;
      slide.classList.toggle("is-active", active);
      slide.inert = !active;
    });

    dots.forEach((dot, index) => {
      const active = index === activeIndex;
      dot.classList.toggle("is-active", active);
      if (active) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  };

  const goTo = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    render();
  };

  const stopAutoplay = () => window.clearInterval(autoplayId);
  const startAutoplay = () => {
    stopAutoplay();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      autoplayId = window.setInterval(() => goTo(activeIndex + 1), 7000);
    }
  };

  hero.querySelector(".hero-arrow-prev")?.addEventListener("click", () => {
    goTo(activeIndex - 1);
    startAutoplay();
  });
  hero.querySelector(".hero-arrow-next")?.addEventListener("click", () => {
    goTo(activeIndex + 1);
    startAutoplay();
  });
  dots.forEach((dot, index) => dot.addEventListener("click", () => {
    goTo(index);
    startAutoplay();
  }));

  hero.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("a, button")) return;
    dragging = true;
    startX = event.clientX;
    dragX = 0;
    stopAutoplay();
    hero.classList.add("is-grabbing");
    track.classList.add("is-dragging");
    hero.setPointerCapture(event.pointerId);
  });

  hero.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    dragX = event.clientX - startX;
    if ((activeIndex === 0 && dragX > 0) || (activeIndex === slides.length - 1 && dragX < 0)) {
      dragX *= 0.18;
    }
    const offset = -activeIndex * hero.clientWidth + dragX;
    track.style.transform = `translate3d(${offset}px, 0, 0)`;
  });

  const finishDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    hero.classList.remove("is-grabbing");
    if (hero.hasPointerCapture(event.pointerId)) hero.releasePointerCapture(event.pointerId);

    const threshold = Math.min(120, hero.clientWidth * 0.15);
    if (dragX < -threshold && activeIndex < slides.length - 1) goTo(activeIndex + 1);
    else if (dragX > threshold && activeIndex > 0) goTo(activeIndex - 1);
    else render();
    startAutoplay();
  };

  hero.addEventListener("pointerup", finishDrag);
  hero.addEventListener("pointercancel", finishDrag);
  hero.addEventListener("mouseenter", stopAutoplay);
  hero.addEventListener("mouseleave", () => {
    if (!dragging) startAutoplay();
  });
  hero.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") goTo(activeIndex - 1);
    if (event.key === "ArrowRight") goTo(activeIndex + 1);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  render(false);
  startAutoplay();
}

function initializeTestimonialsCarousel() {
  const carousel = document.querySelector(".reviews-carousel");
  const viewport = carousel?.querySelector(".reviews-viewport");
  const track = carousel?.querySelector(".reviews-track");
  const slides = [...(track?.querySelectorAll(".review-card") ?? [])];
  const dots = [...(carousel?.querySelectorAll(".reviews-dots button") ?? [])];

  if (!carousel || !viewport || !track || slides.length < 2) return;

  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides.at(-1).cloneNode(true);

  [firstClone, lastClone].forEach((clone) => {
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("a").forEach((link) => link.setAttribute("tabindex", "-1"));
  });

  track.prepend(lastClone);
  track.append(firstClone);

  let selectedIndex = Math.min(4, slides.length - 1);
  let virtualPosition = selectedIndex + 1;
  let startX = 0;
  let dragX = 0;
  let dragging = false;
  let dragged = false;
  let pendingJump = null;

  const getMetrics = () => {
    const slideWidth = slides[0].getBoundingClientRect().width;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    const centerOffset = (viewport.clientWidth - slideWidth) / 2;
    return { step: slideWidth + gap, centerOffset };
  };

  const getOffset = (position) => {
    const { step, centerOffset } = getMetrics();
    return position * step - centerOffset;
  };

  const updateDots = () => {
    dots.forEach((dot, index) => {
      const active = index === selectedIndex;
      dot.classList.toggle("is-active", active);
      if (active) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  };

  const render = (animate = true) => {
    track.classList.toggle("is-dragging", !animate);
    track.style.transform = `translate3d(${-getOffset(virtualPosition)}px, 0, 0)`;
    updateDots();
  };

  const goTo = (nextIndex, animate = true) => {
    pendingJump = null;

    if (nextIndex >= slides.length) {
      selectedIndex = 0;
      virtualPosition = slides.length + 1;
      pendingJump = 1;
    } else if (nextIndex < 0) {
      selectedIndex = slides.length - 1;
      virtualPosition = 0;
      pendingJump = slides.length;
    } else {
      selectedIndex = nextIndex;
      virtualPosition = selectedIndex + 1;
    }

    render(animate);
  };

  track.addEventListener("transitionend", () => {
    if (pendingJump === null) return;
    virtualPosition = pendingJump;
    pendingJump = null;
    render(false);
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => goTo(index));
  });

  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("a, button")) return;
    dragging = true;
    dragged = false;
    startX = event.clientX;
    dragX = 0;
    viewport.classList.add("is-grabbing");
    track.classList.add("is-dragging");
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    dragX = event.clientX - startX;
    dragged ||= Math.abs(dragX) > 6;
    track.style.transform = `translate3d(${(-getOffset(virtualPosition) + dragX)}px, 0, 0)`;
  });

  const finishDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove("is-grabbing");
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);

    const threshold = Math.min(80, viewport.clientWidth * 0.08);
    if (dragX < -threshold) goTo(selectedIndex + 1);
    else if (dragX > threshold) goTo(selectedIndex - 1);
    else render();
  };

  viewport.addEventListener("pointerup", finishDrag);
  viewport.addEventListener("pointercancel", finishDrag);
  viewport.addEventListener("click", (event) => {
    if (!dragged) return;
    event.preventDefault();
    event.stopPropagation();
    dragged = false;
  }, true);

  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") goTo(selectedIndex - 1);
    if (event.key === "ArrowRight") goTo(selectedIndex + 1);
  });

  window.addEventListener("resize", () => render(false));
  render(false);
}

Promise.all([...componentSlots].map(loadComponent))
  .then(() => {
    initializeNavigation();
    initializeHeroCarousel();
    initializeTestimonialsCarousel();
  })
  .catch((error) => {
    console.error(error);
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<p class="component-error">Không thể nạp giao diện. Hãy chạy website qua local server.</p>',
    );
  });
