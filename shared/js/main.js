const menuToggle = document.querySelector('[data-menu-toggle]');
const mainNav = document.querySelector('#main-nav');
const FALLBACK_INSTAGRAM_IMAGE = 'shared/img/logo.webp?v=20260220opt1';

function interpolateTemplate(template, vars = {}) {
  let result = String(template || '');
  Object.entries(vars || {}).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value ?? ''));
  });
  return result;
}

function t(value) {
  if (typeof value !== 'string') return '';
  return window.LaCasitaI18n?.translate ? window.LaCasitaI18n.translate(value) : value;
}

function tf(key, vars = {}, fallback = '') {
  if (window.LaCasitaI18n?.format) {
    return window.LaCasitaI18n.format(key, vars, fallback);
  }
  return interpolateTemplate(fallback, vars);
}

function initMobileMenu() {
  if (!menuToggle || !mainNav) return;

  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    menuToggle.setAttribute('aria-label', isOpen ? t('Cerrar navegación') : t('Abrir navegación'));
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 860) {
        mainNav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', t('Abrir navegación'));
      }
    });
  });

  const handleLanguageChange = () => {
    const isOpen = mainNav.classList.contains('is-open');
    menuToggle.setAttribute('aria-label', isOpen ? t('Cerrar navegación') : t('Abrir navegación'));
  };

  window.addEventListener('lcy:language-changed', handleLanguageChange);
  handleLanguageChange();
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
  card.ariaLabel = t('Abrir publicación de Instagram');

  const image = document.createElement('img');
  image.src = post.image || '';
  image.alt = truncateText(post.caption || t('Publicación reciente de Instagram'), 90);
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
    badge.textContent = t('Reel');
    card.appendChild(badge);
  }

  return card;
}

function showInstagramFallback(container, profileUrl) {
  const message = document.createElement('p');
  message.className = 'instagram-empty';

  const text = document.createElement('span');
  text.textContent = `${t('No se pudo cargar el feed en este momento.') } `;

  const link = document.createElement('a');
  link.href = profileUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = t('Ver perfil en Instagram');

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

function parseWeatherFloat(value) {
  const parsed = Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function isRainWeatherCode(code) {
  return [
    51, 53, 55, 56, 57,
    61, 63, 65, 66, 67,
    80, 81, 82, 95, 96, 99,
  ].includes(Number(code));
}

function formatWeatherNumber(value, digits = 1) {
  if (!Number.isFinite(value)) return '--';
  const language = window.LaCasitaI18n?.getLanguage?.() === 'en' ? 'en-US' : 'es-DO';
  return value.toLocaleString(language, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatWeatherObservedAt(isoDateTime) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})/.exec(String(isoDateTime || '').trim());
  if (!match) return String(isoDateTime || '').trim();

  const [, year, month, day, time] = match;
  if (window.LaCasitaI18n?.getLanguage?.() === 'en') {
    return `${month}/${day}/${year} ${time}`;
  }
  return `${day}/${month}/${year} ${time}`;
}

function renderVillageWeather(card, state) {
  if (!card) return;

  const statusElement = card.querySelector('[data-weather-status]');
  const detailsElement = card.querySelector('[data-weather-details]');
  if (!statusElement || !detailsElement) return;

  const place = String(card.dataset.weatherPlace || 'Punta Cana Village').trim();
  const zoneLabel = tf('village.weather.zone', { place }, `Zona: ${place}`);

  if (state.phase === 'loading') {
    statusElement.textContent = t('Cargando clima...');
    detailsElement.textContent = zoneLabel;
    return;
  }

  if (state.phase === 'error' || !state.data) {
    statusElement.textContent = tf('village.weather.unavailable', {}, 'No se pudo cargar el clima ahora.');
    detailsElement.textContent = zoneLabel;
    return;
  }

  const weather = state.data;
  statusElement.textContent = weather.isRaining
    ? tf('village.weather.raining', {}, 'Está lloviendo ahora.')
    : tf('village.weather.clear', {}, 'No está lloviendo ahora.');

  const observedAt = formatWeatherObservedAt(weather.observedAt);
  detailsElement.textContent = tf(
    'village.weather.updated',
    {
      zone: zoneLabel,
      temp: formatWeatherNumber(weather.temperature, 1),
      wind: formatWeatherNumber(weather.windSpeed, 1),
      time: observedAt || '--',
    },
    `${zoneLabel} · ${formatWeatherNumber(weather.temperature, 1)}°C · Viento ${formatWeatherNumber(weather.windSpeed, 1)} km/h · Actualizado: ${observedAt || '--'}`,
  );
}

async function fetchVillageWeather(card) {
  const latitude = parseWeatherFloat(card?.dataset.weatherLat);
  const longitude = parseWeatherFloat(card?.dataset.weatherLon);
  const timezone = String(card?.dataset.weatherTimezone || 'America/Santo_Domingo').trim();

  if (latitude === null || longitude === null) {
    throw new Error('weather coordinates are missing');
  }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current_weather: 'true',
    timezone,
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`weather unavailable (${response.status})`);
  }

  const payload = await response.json();
  const current = payload?.current_weather;
  if (!current) {
    throw new Error('weather payload invalid');
  }

  const temperature = parseWeatherFloat(current.temperature);
  const windSpeed = parseWeatherFloat(current.windspeed);

  return {
    temperature: temperature ?? 0,
    windSpeed: windSpeed ?? 0,
    observedAt: String(current.time || ''),
    isRaining: isRainWeatherCode(current.weathercode),
  };
}

function initVillageWeather() {
  const weatherCard = document.querySelector('[data-weather-card]');
  if (!weatherCard) return;

  const state = {
    phase: 'loading',
    data: null,
  };

  const render = () => {
    renderVillageWeather(weatherCard, state);
  };

  const load = async () => {
    state.phase = 'loading';
    render();

    try {
      state.data = await fetchVillageWeather(weatherCard);
      state.phase = 'ready';
    } catch {
      state.data = null;
      state.phase = 'error';
    }

    render();
  };

  window.addEventListener('lcy:language-changed', render);
  load();
  window.setInterval(load, 1000 * 60 * 15);
}

function setReservationStatus(element, type, message) {
  if (!element) return;
  element.classList.remove('is-success', 'is-error');
  if (!message) {
    element.textContent = '';
    return;
  }
  element.textContent = message;
  if (type) {
    element.classList.add(type === 'success' ? 'is-success' : 'is-error');
  }
}

function getTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getReservationErrorMessage(status, payload) {
  const apiMessage = typeof payload?.error === 'string' ? payload.error.trim() : '';

  if (status === 429) {
    const retryAfter = Number.parseInt(String(payload?.retry_after_seconds ?? ''), 10);
    if (Number.isInteger(retryAfter) && retryAfter > 0) {
      const retryMinutes = Math.max(1, Math.ceil(retryAfter / 60));
      return tf(
        'common.rate_limit_retry_minutes',
        { minutes: retryMinutes },
        `Demasiadas solicitudes en poco tiempo. Intenta nuevamente en ${retryMinutes} minuto(s).`,
      );
    }
    return apiMessage ? t(apiMessage) : t('Demasiadas solicitudes en poco tiempo. Intenta nuevamente en unos minutos.');
  }

  if (status === 409) {
    return apiMessage ? t(apiMessage) : t('Ya recibimos una solicitud similar recientemente.');
  }

  if (status === 422) {
    return apiMessage ? t(apiMessage) : t('Revisa los datos del formulario antes de enviarlo.');
  }

  if (status === 503) {
    return apiMessage ? t(apiMessage) : t('Reservas temporalmente no disponibles. Intenta nuevamente en breve.');
  }

  return apiMessage ? t(apiMessage) : t(`No se pudo enviar la reserva (${status}). Intenta de nuevo.`);
}

function getCateringErrorMessage(status, payload) {
  const apiMessage = typeof payload?.error === 'string' ? payload.error.trim() : '';

  if (status === 429) {
    const retryAfter = Number.parseInt(String(payload?.retry_after_seconds ?? ''), 10);
    if (Number.isInteger(retryAfter) && retryAfter > 0) {
      const retryMinutes = Math.max(1, Math.ceil(retryAfter / 60));
      return tf(
        'common.rate_limit_retry_minutes',
        { minutes: retryMinutes },
        `Demasiadas solicitudes en poco tiempo. Intenta nuevamente en ${retryMinutes} minuto(s).`,
      );
    }
    return apiMessage ? t(apiMessage) : t('Demasiadas solicitudes en poco tiempo. Intenta nuevamente en unos minutos.');
  }

  if (status === 409) {
    return apiMessage ? t(apiMessage) : t('Ya recibimos una solicitud similar recientemente.');
  }

  if (status === 422) {
    return apiMessage ? t(apiMessage) : t('Revisa los datos del formulario antes de enviarlo.');
  }

  if (status === 503) {
    return apiMessage ? t(apiMessage) : t('Solicitudes temporalmente no disponibles. Intenta nuevamente en breve.');
  }

  return apiMessage ? t(apiMessage) : t(`No se pudo enviar la solicitud (${status}). Intenta de nuevo.`);
}

function initReservationForm() {
  const form = document.querySelector('[data-reservation-form]');
  if (!form) return;

  const statusElement = form.querySelector('[data-reservation-status]');
  const submitButton = form.querySelector('[data-reservation-submit]');
  const dateInput = form.querySelector('input[name="fecha"]');
  const endpoint = (form.dataset.reservationEndpoint || '').trim();
  const timeoutMs = Number.parseInt(form.dataset.reservationTimeout || '12000', 10);

  if (dateInput) {
    dateInput.min = getTodayIsoDate();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setReservationStatus(statusElement, '', '');

    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const honeypot = String(formData.get('empresa') || '').trim();
    if (honeypot) {
      setReservationStatus(statusElement, 'success', t('Solicitud enviada. Te confirmaremos la reserva pronto.'));
      form.reset();
      if (dateInput) {
        dateInput.min = getTodayIsoDate();
      }
      return;
    }

    if (!endpoint) {
      setReservationStatus(statusElement, 'error', t('Reservas temporalmente no disponibles. Intenta nuevamente en breve.'));
      return;
    }

    const payload = {
      full_name: String(formData.get('nombre') || '').trim(),
      phone: String(formData.get('telefono') || '').trim(),
      email: String(formData.get('correo') || '').trim(),
      location: String(formData.get('localidad') || '').trim(),
      reservation_date: String(formData.get('fecha') || '').trim(),
      reservation_time: String(formData.get('hora') || '').trim(),
      guests: Number.parseInt(String(formData.get('personas') || '0'), 10),
      comments: String(formData.get('comentarios') || '').trim(),
      source: 'website',
    };

    if (payload.reservation_date && payload.reservation_date < getTodayIsoDate()) {
      setReservationStatus(statusElement, 'error', t('La fecha de reserva no puede ser anterior a hoy.'));
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 12000);
    const initialButtonText = submitButton?.textContent || '';

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('is-loading');
        submitButton.textContent = t('Enviando...');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      let responsePayload = null;
      try {
        responsePayload = await response.json();
      } catch (parseError) {
        responsePayload = null;
      }

      if (!response.ok || !responsePayload?.ok) {
        const errorMessage = getReservationErrorMessage(response.status, responsePayload);
        throw new Error(errorMessage);
      }

      form.reset();
      if (dateInput) {
        dateInput.min = getTodayIsoDate();
      }
      setReservationStatus(
        statusElement,
        'success',
        responsePayload?.message ? t(responsePayload.message) : t('Solicitud enviada. Te contactaremos para confirmar disponibilidad.'),
      );
    } catch (error) {
      const isAbort = error instanceof DOMException && error.name === 'AbortError';
      const message = isAbort
        ? t('La solicitud tardó demasiado. Revisa tu conexión e intenta nuevamente.')
        : t(error?.message || 'No se pudo enviar la reserva. Intenta nuevamente.');
      setReservationStatus(statusElement, 'error', message);
    } finally {
      window.clearTimeout(timeout);
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove('is-loading');
        submitButton.textContent = initialButtonText || t('Enviar solicitud');
      }
    }
  });
}

function initCateringForm() {
  const form = document.querySelector('[data-catering-form]');
  if (!form) return;

  const statusElement = form.querySelector('[data-catering-status]');
  const submitButton = form.querySelector('[data-catering-submit]');
  const dateInput = form.querySelector('input[name="fecha_evento"]');
  const endpoint = (form.dataset.cateringEndpoint || '').trim();
  const timeoutMs = Number.parseInt(form.dataset.cateringTimeout || '12000', 10);

  if (dateInput) {
    dateInput.min = getTodayIsoDate();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setReservationStatus(statusElement, '', '');

    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const honeypot = String(formData.get('empresa') || '').trim();
    if (honeypot) {
      setReservationStatus(statusElement, 'success', t('Solicitud enviada. Te contactaremos pronto.'));
      form.reset();
      if (dateInput) {
        dateInput.min = getTodayIsoDate();
      }
      return;
    }

    if (!endpoint) {
      setReservationStatus(statusElement, 'error', t('Solicitudes temporalmente no disponibles. Intenta nuevamente en breve.'));
      return;
    }

    const payload = {
      full_name: String(formData.get('nombre') || '').trim(),
      phone: String(formData.get('telefono') || '').trim(),
      email: String(formData.get('correo') || '').trim(),
      preferred_location: String(formData.get('localidad_preferida') || '').trim(),
      event_date: String(formData.get('fecha_evento') || '').trim(),
      guests_estimate: Number.parseInt(String(formData.get('personas_estimadas') || '0'), 10),
      details: String(formData.get('detalles') || '').trim(),
      source: 'website',
    };

    if (payload.event_date && payload.event_date < getTodayIsoDate()) {
      setReservationStatus(statusElement, 'error', t('La fecha del evento no puede ser anterior a hoy.'));
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 12000);
    const initialButtonText = submitButton?.textContent || '';

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('is-loading');
        submitButton.textContent = t('Enviando...');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      let responsePayload = null;
      try {
        responsePayload = await response.json();
      } catch {
        responsePayload = null;
      }

      if (!response.ok || !responsePayload?.ok) {
        const errorMessage = getCateringErrorMessage(response.status, responsePayload);
        throw new Error(errorMessage);
      }

      form.reset();
      if (dateInput) {
        dateInput.min = getTodayIsoDate();
      }
      setReservationStatus(
        statusElement,
        'success',
        responsePayload?.message ? t(responsePayload.message) : t('Solicitud enviada. Te contactaremos para coordinar detalles.'),
      );
    } catch (error) {
      const isAbort = error instanceof DOMException && error.name === 'AbortError';
      const message = isAbort
        ? t('La solicitud tardó demasiado. Revisa tu conexión e intenta nuevamente.')
        : t(error?.message || 'No se pudo enviar la solicitud. Intenta nuevamente.');
      setReservationStatus(statusElement, 'error', message);
    } finally {
      window.clearTimeout(timeout);
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove('is-loading');
        submitButton.textContent = initialButtonText || t('Enviar solicitud');
      }
    }
  });
}

initMobileMenu();
initMenuBook();
initInstagramFeed();
initVillageWeather();
initReservationForm();
initCateringForm();
