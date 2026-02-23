(function initReservationsAdminPanel() {
  const panel = document.querySelector('[data-admin-panel]');
  if (!panel) return;

  const STORAGE_BASE_KEY = 'reservations_admin_api_base';
  const STORAGE_API_KEY = 'reservations_admin_internal_api_key';

  const ui = {
    baseInput: panel.querySelector('[data-admin-api-base]'),
    apiKeyInput: panel.querySelector('[data-admin-api-key]'),
    connectButton: panel.querySelector('[data-admin-connect]'),
    disconnectButton: panel.querySelector('[data-admin-disconnect]'),
    refreshButton: panel.querySelector('[data-admin-refresh]'),
    connectionStatus: panel.querySelector('[data-admin-connection-status]'),
    lastRequestId: panel.querySelector('[data-admin-last-request-id]'),
    reservationsCount: panel.querySelector('[data-admin-reservations-count]'),
    reservationsBody: panel.querySelector('[data-admin-reservations-body]'),
    notificationsCount: panel.querySelector('[data-admin-notifications-count]'),
    notificationsBody: panel.querySelector('[data-admin-notifications-body]'),
    loadReservationsButton: panel.querySelector('[data-admin-load-reservations]'),
    loadNotificationsButton: panel.querySelector('[data-admin-load-notifications]'),
    dispatchButton: panel.querySelector('[data-admin-dispatch]'),
    dispatchLimitInput: panel.querySelector('[data-notif-dispatch-limit]'),
    reservationFilters: {
      status: panel.querySelector('[data-filter-res-status]'),
      location: panel.querySelector('[data-filter-res-location]'),
      dateFrom: panel.querySelector('[data-filter-res-date-from]'),
      dateTo: panel.querySelector('[data-filter-res-date-to]'),
    },
    notificationFilters: {
      status: panel.querySelector('[data-filter-notif-status]'),
      channel: panel.querySelector('[data-filter-notif-channel]'),
      reservationId: panel.querySelector('[data-filter-notif-reservation-id]'),
    },
    metricNodes: Object.fromEntries(
      Array.from(panel.querySelectorAll('[data-metric]')).map((node) => [node.dataset.metric, node]),
    ),
  };

  const state = {
    apiBase: '',
    internalKey: '',
    isConnected: false,
    isBusy: false,
  };

  function normalizeBaseUrl(value) {
    return String(value || '').trim().replace(/\/+$/, '');
  }

  function escapeHtml(value) {
    const input = String(value == null ? '' : value);
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatIsoDate(isoDate) {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate || '-';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  }

  function formatDateTime(date, time) {
    return `${formatIsoDate(date)} ${time || ''}`.trim();
  }

  function formatStatus(status) {
    if (status === 'pending') return 'Pendiente';
    if (status === 'confirmed') return 'Confirmada';
    if (status === 'cancelled') return 'Cancelada';
    if (status === 'queued') return 'Queued';
    if (status === 'sent') return 'Sent';
    if (status === 'failed') return 'Failed';
    return status || '-';
  }

  function setConnectionStatus(message, type) {
    if (!ui.connectionStatus) return;
    ui.connectionStatus.textContent = message || '';
    ui.connectionStatus.classList.remove('is-success', 'is-error');
    if (type === 'success') ui.connectionStatus.classList.add('is-success');
    if (type === 'error') ui.connectionStatus.classList.add('is-error');
  }

  function setLastRequestId(value) {
    if (!ui.lastRequestId) return;
    ui.lastRequestId.textContent = value || 'N/A';
  }

  function setBusy(value) {
    state.isBusy = Boolean(value);
    const disabled = !state.isConnected || state.isBusy;

    if (ui.refreshButton) ui.refreshButton.disabled = disabled;
    if (ui.loadReservationsButton) ui.loadReservationsButton.disabled = disabled;
    if (ui.loadNotificationsButton) ui.loadNotificationsButton.disabled = disabled;
    if (ui.dispatchButton) ui.dispatchButton.disabled = disabled;
  }

  function applyConnectionUi() {
    if (ui.baseInput) ui.baseInput.value = state.apiBase;
    if (ui.apiKeyInput) ui.apiKeyInput.value = state.internalKey;

    if (ui.connectButton) ui.connectButton.disabled = state.isBusy;
    if (ui.disconnectButton) ui.disconnectButton.disabled = !state.isConnected || state.isBusy;

    setBusy(state.isBusy);
  }

  function saveSession() {
    if (!state.apiBase || !state.internalKey) return;
    window.sessionStorage.setItem(STORAGE_BASE_KEY, state.apiBase);
    window.sessionStorage.setItem(STORAGE_API_KEY, state.internalKey);
  }

  function restoreSession() {
    const savedBase = normalizeBaseUrl(window.sessionStorage.getItem(STORAGE_BASE_KEY) || '');
    const savedKey = String(window.sessionStorage.getItem(STORAGE_API_KEY) || '').trim();

    if (!savedBase || !savedKey) return;
    state.apiBase = savedBase;
    state.internalKey = savedKey;
    state.isConnected = false;
    applyConnectionUi();
  }

  function clearSession() {
    window.sessionStorage.removeItem(STORAGE_BASE_KEY);
    window.sessionStorage.removeItem(STORAGE_API_KEY);
  }

  function setMetric(name, value) {
    const node = ui.metricNodes[name];
    if (!node) return;
    node.textContent = `${Number.isFinite(Number(value)) ? Number(value) : 0}`;
  }

  function renderMetrics(metrics) {
    const reservations = metrics?.reservations || {};
    const notifications = metrics?.notifications || {};

    setMetric('reservations_pending', reservations.pending || 0);
    setMetric('reservations_confirmed', reservations.confirmed || 0);
    setMetric('reservations_cancelled', reservations.cancelled || 0);
    setMetric('notifications_queued', notifications.queued || 0);
    setMetric('notifications_ready', notifications.ready_to_dispatch || 0);
    setMetric('notifications_failed_24h', notifications.failed_last_24h || 0);
  }

  function renderReservations(reservations) {
    if (!ui.reservationsBody) return;
    const rows = Array.isArray(reservations) ? reservations : [];

    if (ui.reservationsCount) {
      ui.reservationsCount.textContent = `Total: ${rows.length}`;
    }

    if (!rows.length) {
      ui.reservationsBody.innerHTML = '<tr><td colspan="7">Sin resultados para los filtros actuales.</td></tr>';
      return;
    }

    ui.reservationsBody.innerHTML = rows
      .map((reservation) => {
        const id = Number.parseInt(String(reservation.id), 10);
        const actions = [
          `<button type="button" class="btn btn-secondary admin-mini-btn" data-action="set-status" data-reservation-id="${id}" data-target-status="pending">Pendiente</button>`,
          `<button type="button" class="btn btn-secondary admin-mini-btn" data-action="set-status" data-reservation-id="${id}" data-target-status="confirmed">Confirmar</button>`,
          `<button type="button" class="btn btn-secondary admin-mini-btn" data-action="set-status" data-reservation-id="${id}" data-target-status="cancelled">Cancelar</button>`,
          `<button type="button" class="btn btn-secondary admin-mini-btn" data-action="notify" data-reservation-id="${id}">Notificar</button>`,
        ].join('');

        return `
          <tr>
            <td>#${id}</td>
            <td>${escapeHtml(reservation.full_name || '-')}</td>
            <td>
              <div>${escapeHtml(reservation.phone || '-')}</div>
              <div>${escapeHtml(reservation.email || '-')}</div>
            </td>
            <td>${escapeHtml(formatDateTime(reservation.reservation_date, reservation.reservation_time))}</td>
            <td>${escapeHtml(reservation.location || '-')}</td>
            <td>${escapeHtml(formatStatus(reservation.status))}</td>
            <td><div class="admin-actions-stack">${actions}</div></td>
          </tr>
        `;
      })
      .join('');
  }

  function renderNotifications(notifications) {
    if (!ui.notificationsBody) return;
    const rows = Array.isArray(notifications) ? notifications : [];

    if (ui.notificationsCount) {
      ui.notificationsCount.textContent = `Total: ${rows.length}`;
    }

    if (!rows.length) {
      ui.notificationsBody.innerHTML = '<tr><td colspan="9">Sin resultados para los filtros actuales.</td></tr>';
      return;
    }

    ui.notificationsBody.innerHTML = rows
      .map((notification) => {
        const id = Number.parseInt(String(notification.id), 10);
        const isRetryable = notification.status === 'failed';
        const isDispatchable = notification.status === 'queued';

        const retryButton = isRetryable
          ? `<button type="button" class="btn btn-secondary admin-mini-btn" data-action="retry" data-notification-id="${id}">Retry</button>`
          : '';

        const dispatchButton = isDispatchable
          ? `<button type="button" class="btn btn-secondary admin-mini-btn" data-action="dispatch-one" data-notification-id="${id}">Despachar</button>`
          : '';

        return `
          <tr>
            <td>#${id}</td>
            <td>#${escapeHtml(notification.reservation_id || '')}</td>
            <td>${escapeHtml(notification.channel || '-')}</td>
            <td>${escapeHtml(notification.recipient || '-')}</td>
            <td>${escapeHtml(formatStatus(notification.status))}</td>
            <td>${escapeHtml(`${notification.attempts || 0}/${notification.max_attempts || 0}`)}</td>
            <td>${escapeHtml(notification.next_attempt_at || '-')}</td>
            <td>${escapeHtml(notification.last_error || '-')}</td>
            <td><div class="admin-actions-stack">${dispatchButton}${retryButton}</div></td>
          </tr>
        `;
      })
      .join('');
  }

  function ensureConnected() {
    if (!state.isConnected || !state.apiBase || !state.internalKey) {
      throw new Error('Conecta primero el panel con URL y llave interna.');
    }
  }

  async function apiRequest(path, options = {}) {
    ensureConnected();

    const method = options.method || 'GET';
    const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 15000;
    const body = options.body;
    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${state.internalKey}`,
      ...(options.headers || {}),
    };

    let payload = null;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${state.apiBase}${path}`, {
        method,
        headers: {
          ...headers,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const requestId = response.headers.get('X-Request-Id') || '';
      if (requestId) {
        setLastRequestId(requestId);
      }

      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok || !payload?.ok) {
        const error = new Error(payload?.error || `Error HTTP ${response.status}`);
        error.status = response.status;
        error.payload = payload;
        throw error;
      }

      return payload;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('La solicitud tardó demasiado. Intenta nuevamente.');
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function buildReservationsQuery() {
    const params = new URLSearchParams();
    params.set('limit', '200');

    const status = ui.reservationFilters.status?.value || '';
    const location = ui.reservationFilters.location?.value || '';
    const dateFrom = ui.reservationFilters.dateFrom?.value || '';
    const dateTo = ui.reservationFilters.dateTo?.value || '';

    if (status) params.set('status', status);
    if (location) params.set('location', location);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);

    return params.toString();
  }

  function buildNotificationsQuery() {
    const params = new URLSearchParams();
    params.set('limit', '200');

    const status = ui.notificationFilters.status?.value || '';
    const channel = ui.notificationFilters.channel?.value || '';
    const reservationId = (ui.notificationFilters.reservationId?.value || '').trim();

    if (status) params.set('status', status);
    if (channel) params.set('channel', channel);
    if (reservationId) params.set('reservation_id', reservationId);

    return params.toString();
  }

  async function loadMetrics() {
    const payload = await apiRequest('/api/internal/metrics/summary');
    renderMetrics(payload.metrics || {});
  }

  async function loadReservations() {
    const query = buildReservationsQuery();
    const payload = await apiRequest(`/api/internal/reservations?${query}`);
    renderReservations(payload.reservations || []);
  }

  async function loadNotifications() {
    const query = buildNotificationsQuery();
    const payload = await apiRequest(`/api/internal/notifications?${query}`);
    renderNotifications(payload.notifications || []);
  }

  async function refreshAll() {
    setBusy(true);
    try {
      await Promise.all([loadMetrics(), loadReservations(), loadNotifications()]);
      setConnectionStatus('Panel sincronizado correctamente.', 'success');
    } finally {
      setBusy(false);
    }
  }

  async function connectPanel() {
    const base = normalizeBaseUrl(ui.baseInput?.value || '');
    const key = String(ui.apiKeyInput?.value || '').trim();

    if (!base || !/^https?:\/\//i.test(base)) {
      setConnectionStatus('Debes colocar una URL base válida para la API.', 'error');
      return;
    }

    if (!key || key.length < 16) {
      setConnectionStatus('Debes colocar una Internal API Key válida.', 'error');
      return;
    }

    state.apiBase = base;
    state.internalKey = key;
    state.isConnected = true;
    applyConnectionUi();

    setConnectionStatus('Validando credenciales...', '');

    try {
      await refreshAll();
      saveSession();
    } catch (error) {
      state.isConnected = false;
      applyConnectionUi();
      setConnectionStatus(error?.message || 'No se pudo conectar al panel interno.', 'error');
    }
  }

  function disconnectPanel() {
    state.isConnected = false;
    state.internalKey = '';
    clearSession();

    if (ui.apiKeyInput) ui.apiKeyInput.value = '';
    if (ui.reservationsBody) {
      ui.reservationsBody.innerHTML = '<tr><td colspan="7">Panel desconectado.</td></tr>';
    }
    if (ui.notificationsBody) {
      ui.notificationsBody.innerHTML = '<tr><td colspan="9">Panel desconectado.</td></tr>';
    }

    renderMetrics({});
    setLastRequestId('N/A');
    setConnectionStatus('Panel desconectado.', '');
    applyConnectionUi();
  }

  async function updateReservationStatus(reservationId, status) {
    setBusy(true);
    try {
      await apiRequest(`/api/internal/reservations/${reservationId}/status`, {
        method: 'PATCH',
        body: {
          status,
          updated_by: 'panel_interno',
          note: `Actualizado desde panel interno (${new Date().toISOString()})`,
          enqueue_notifications: true,
          dispatch_now: false,
        },
      });

      setConnectionStatus(`Reserva #${reservationId} actualizada a ${formatStatus(status)}.`, 'success');
      await Promise.all([loadMetrics(), loadReservations(), loadNotifications()]);
    } catch (error) {
      setConnectionStatus(error?.message || 'No se pudo actualizar el estado de la reserva.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function notifyReservation(reservationId) {
    setBusy(true);
    try {
      await apiRequest(`/api/internal/reservations/${reservationId}/notify`, {
        method: 'POST',
        body: {
          channels: ['email', 'whatsapp'],
          dispatch_now: false,
          trigger: 'manual_panel',
          updated_by: 'panel_interno',
        },
      });

      setConnectionStatus(`Notificaciones encoladas para la reserva #${reservationId}.`, 'success');
      await Promise.all([loadMetrics(), loadNotifications()]);
    } catch (error) {
      setConnectionStatus(error?.message || 'No se pudo encolar la notificación.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function dispatchQueue(ids) {
    const rawLimit = Number.parseInt(String(ui.dispatchLimitInput?.value || '20'), 10);
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 20;

    setBusy(true);
    try {
      const payload = {
        limit,
        force: true,
      };

      if (Array.isArray(ids) && ids.length) {
        payload.ids = ids;
        payload.limit = Math.max(1, Math.min(ids.length, 50));
      }

      const response = await apiRequest('/api/internal/notifications/dispatch', {
        method: 'POST',
        body: payload,
      });

      const summary = response.summary || {};
      setConnectionStatus(
        `Despacho completado: ${summary.sent || 0} sent, ${summary.failed || 0} failed, ${summary.requeued || 0} requeued.`,
        'success',
      );
      await Promise.all([loadMetrics(), loadNotifications()]);
    } catch (error) {
      setConnectionStatus(error?.message || 'No se pudo despachar la cola.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function retryNotification(notificationId) {
    setBusy(true);
    try {
      await apiRequest(`/api/internal/notifications/${notificationId}/retry`, {
        method: 'POST',
        body: { dispatch_now: true },
      });
      setConnectionStatus(`Notificación #${notificationId} reintentada.`, 'success');
      await Promise.all([loadMetrics(), loadNotifications()]);
    } catch (error) {
      setConnectionStatus(error?.message || 'No se pudo reintentar la notificación.', 'error');
    } finally {
      setBusy(false);
    }
  }

  function bindReservationsActions() {
    if (!ui.reservationsBody) return;
    ui.reservationsBody.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const action = target.dataset.action || '';
      const reservationId = Number.parseInt(String(target.dataset.reservationId || ''), 10);
      if (!Number.isInteger(reservationId) || reservationId <= 0) return;

      if (action === 'set-status') {
        const nextStatus = String(target.dataset.targetStatus || '').trim();
        if (!nextStatus) return;
        updateReservationStatus(reservationId, nextStatus);
      }

      if (action === 'notify') {
        notifyReservation(reservationId);
      }
    });
  }

  function bindNotificationsActions() {
    if (!ui.notificationsBody) return;
    ui.notificationsBody.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const action = target.dataset.action || '';
      const notificationId = Number.parseInt(String(target.dataset.notificationId || ''), 10);
      if (!Number.isInteger(notificationId) || notificationId <= 0) return;

      if (action === 'retry') {
        retryNotification(notificationId);
      }

      if (action === 'dispatch-one') {
        dispatchQueue([notificationId]);
      }
    });
  }

  function bindBaseActions() {
    ui.connectButton?.addEventListener('click', () => {
      connectPanel();
    });

    ui.disconnectButton?.addEventListener('click', () => {
      disconnectPanel();
    });

    ui.refreshButton?.addEventListener('click', async () => {
      if (!state.isConnected) return;
      setBusy(true);
      try {
        await refreshAll();
      } catch (error) {
        setConnectionStatus(error?.message || 'No se pudo refrescar el panel.', 'error');
      } finally {
        setBusy(false);
      }
    });

    ui.loadReservationsButton?.addEventListener('click', async () => {
      if (!state.isConnected) return;
      setBusy(true);
      try {
        await loadReservations();
        setConnectionStatus('Reservas actualizadas.', 'success');
      } catch (error) {
        setConnectionStatus(error?.message || 'No se pudieron cargar las reservas.', 'error');
      } finally {
        setBusy(false);
      }
    });

    ui.loadNotificationsButton?.addEventListener('click', async () => {
      if (!state.isConnected) return;
      setBusy(true);
      try {
        await loadNotifications();
        setConnectionStatus('Outbox actualizado.', 'success');
      } catch (error) {
        setConnectionStatus(error?.message || 'No se pudieron cargar las notificaciones.', 'error');
      } finally {
        setBusy(false);
      }
    });

    ui.dispatchButton?.addEventListener('click', () => {
      if (!state.isConnected) return;
      dispatchQueue([]);
    });

    ui.apiKeyInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        connectPanel();
      }
    });
  }

  function init() {
    restoreSession();
    applyConnectionUi();
    setConnectionStatus('Panel listo. Ingresa URL y llave interna para conectar.', '');
    bindBaseActions();
    bindReservationsActions();
    bindNotificationsActions();

    if (state.apiBase && state.internalKey) {
      setConnectionStatus('Sesión previa detectada. Pulsa "Conectar" para cargar datos.', '');
    }
  }

  init();
})();
