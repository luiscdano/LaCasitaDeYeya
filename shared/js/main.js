const menuToggle = document.querySelector('[data-menu-toggle]');
const mainNav = document.querySelector('#main-nav');
const FALLBACK_INSTAGRAM_IMAGE = 'shared/img/logo.png?v=20260217';

function initMobileMenu() {
  if (!menuToggle || !mainNav) return;

  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 860) {
        mainNav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

function truncateText(value, max = 120) {
  if (typeof value !== 'string') return '';
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function getInstagramPostUrl(post, profileUrl) {
  const shortcode = typeof post?.shortcode === 'string' ? post.shortcode.trim() : '';
  const permalink = typeof post?.permalink === 'string' ? post.permalink.trim() : '';

  if (shortcode) {
    // Reels can redirect to profile on some clients; /p/{shortcode}/ stays stable.
    const canonicalPostUrl = `https://www.instagram.com/p/${shortcode}/`;
    if (post?.is_video || permalink.includes('/reel/')) {
      return canonicalPostUrl;
    }
  }

  if (permalink) {
    return permalink;
  }

  if (shortcode) {
    return `https://www.instagram.com/p/${shortcode}/`;
  }

  return profileUrl;
}

function buildInstagramCard(post, profileUrl) {
  const card = document.createElement('a');
  card.className = 'instagram-post';
  card.href = getInstagramPostUrl(post, profileUrl);
  card.target = '_blank';
  card.rel = 'noopener noreferrer';
  card.ariaLabel = 'Abrir publicación de Instagram';

  const image = document.createElement('img');
  image.src = post.image || '';
  image.alt = truncateText(post.caption || 'Publicación reciente de Instagram', 90);
  image.loading = 'lazy';
  image.decoding = 'async';
  image.referrerPolicy = 'no-referrer';
  image.addEventListener('error', () => {
    image.src = FALLBACK_INSTAGRAM_IMAGE;
  });

  card.appendChild(image);

  if (post.is_video) {
    const badge = document.createElement('span');
    badge.className = 'instagram-badge is-reel';
    badge.textContent = 'Reel';
    card.appendChild(badge);
  }

  return card;
}

function showInstagramFallback(container, profileUrl) {
  const message = document.createElement('p');
  message.className = 'instagram-empty';

  const text = document.createElement('span');
  text.textContent = 'No se pudo cargar el feed en este momento. ';

  const link = document.createElement('a');
  link.href = profileUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Ver perfil en Instagram';

  message.appendChild(text);
  message.appendChild(link);

  container.innerHTML = '';
  container.appendChild(message);
}

async function initInstagramFeed() {
  const container = document.querySelector('[data-instagram-feed]');
  if (!container) return;

  const feedPath = container.dataset.instagramFeed;
  const profileUrl =
    container.dataset.instagramProfile ||
    'https://www.instagram.com/lacasitadeyeya/?hl=es';
  const limit = Number.parseInt(container.dataset.instagramLimit || '10', 10);

  if (!feedPath) {
    showInstagramFallback(container, profileUrl);
    return;
  }

  try {
    const response = await fetch(feedPath, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Feed no disponible (${response.status})`);
    }

    const payload = await response.json();
    const posts = Array.isArray(payload.posts)
      ? payload.posts.filter((post) => post && post.image).slice(0, limit)
      : [];

    if (!posts.length) {
      throw new Error('Feed sin publicaciones');
    }

    const fragment = document.createDocumentFragment();
    posts.forEach((post) => {
      fragment.appendChild(buildInstagramCard(post, profileUrl));
    });

    container.innerHTML = '';
    container.appendChild(fragment);
  } catch (error) {
    showInstagramFallback(container, profileUrl);
  }
}

function initMenuBook() {
  const book = document.querySelector('[data-menu-book]');
  if (!book) return;

  const pages = Array.from(book.querySelectorAll('[data-menu-page]'));
  const prevButtons = Array.from(book.querySelectorAll('[data-menu-prev]'));
  const nextButtons = Array.from(book.querySelectorAll('[data-menu-next]'));

  if (!pages.length) return;

  let currentIndex = 0;
  const total = pages.length;

  function render() {
    pages.forEach((page, index) => {
      const isActive = index === currentIndex;
      page.classList.toggle('is-active', isActive);

      if (isActive) {
        const pageBody = page.querySelector('.menu-page-body');
        if (pageBody) {
          pageBody.scrollTop = 0;
        }
      }
    });

    const isSinglePage = total <= 1;
    prevButtons.forEach((button) => {
      button.disabled = isSinglePage;
    });

    nextButtons.forEach((button) => {
      button.disabled = isSinglePage;
    });
  }

  function goPrev() {
    if (total <= 1) return;
    currentIndex = (currentIndex - 1 + total) % total;
    render();
  }

  function goNext() {
    if (total <= 1) return;
    currentIndex = (currentIndex + 1) % total;
    render();
  }

  prevButtons.forEach((button) => {
    button.addEventListener('click', goPrev);
  });

  nextButtons.forEach((button) => {
    button.addEventListener('click', goNext);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      goPrev();
    }
    if (event.key === 'ArrowRight') {
      goNext();
    }
  });

  render();

  if (document.body.classList.contains('menu-view')) {
    const resetMenuViewport = () => {
      window.scrollTo(0, 0);

      const activePage = pages[currentIndex];
      const pageBody = activePage?.querySelector('.menu-page-body');
      if (pageBody) {
        pageBody.scrollTop = 0;
      }
    };

    resetMenuViewport();
    window.addEventListener('pageshow', resetMenuViewport);
  }
}

initMobileMenu();
initMenuBook();
initInstagramFeed();
