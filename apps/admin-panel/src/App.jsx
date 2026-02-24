import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';

const DEFAULT_API_BASE = 'https://lacasita-reservations-api.lacasita-yeya.workers.dev';
const STORAGE_BASE_KEY = 'reservations_admin_api_base';
const STORAGE_API_KEY = 'reservations_admin_internal_api_key';

const RESERVATION_STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'cancelled', label: 'Cancelada' },
];

const LOCATION_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'village', label: 'Village' },
  { value: 'downtown', label: 'Downtown' },
  { value: 'los-corales', label: 'Los Corales' },
];

const NOTIFICATION_STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'queued', label: 'Queued' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
];

const NOTIFICATION_CHANNEL_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function formatReservationStatus(status) {
  if (status === 'pending') return 'Pendiente';
  if (status === 'confirmed') return 'Confirmada';
  if (status === 'cancelled') return 'Cancelada';
  return status || '-';
}

function formatNotificationStatus(status) {
  if (status === 'queued') return 'Queued';
  if (status === 'sent') return 'Sent';
  if (status === 'failed') return 'Failed';
  return status || '-';
}

function formatLocation(location) {
  if (location === 'village') return 'Village';
  if (location === 'downtown') return 'Downtown';
  if (location === 'los-corales') return 'Los Corales';
  return location || '-';
}

function formatDate(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate || '-';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function formatDateTime(date, time) {
  return `${formatDate(date)} ${time || ''}`.trim();
}

function statusChipColor(status) {
  if (status === 'pending' || status === 'queued') return 'warning';
  if (status === 'confirmed' || status === 'sent') return 'success';
  if (status === 'cancelled' || status === 'failed') return 'error';
  return 'default';
}

function MetricCard({ title, value, color = 'primary' }) {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4" color={`${color}.main`} sx={{ mt: 0.5 }}>
          {Number.isFinite(Number(value)) ? Number(value) : 0}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function App() {
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [lastRequestId, setLastRequestId] = useState('N/A');
  const [alertState, setAlertState] = useState({ type: 'info', message: 'Panel listo para conectar.' });

  const [metrics, setMetrics] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [reservationFilters, setReservationFilters] = useState({
    status: '',
    location: '',
    dateFrom: '',
    dateTo: '',
  });

  const [notificationFilters, setNotificationFilters] = useState({
    status: '',
    channel: '',
    reservationId: '',
  });

  const [dispatchLimit, setDispatchLimit] = useState('20');

  const connectionReady = useMemo(() => {
    return isConnected && Boolean(apiBase) && Boolean(apiKey);
  }, [isConnected, apiBase, apiKey]);

  useEffect(() => {
    const savedBase = normalizeBaseUrl(window.sessionStorage.getItem(STORAGE_BASE_KEY) || '');
    const savedKey = String(window.sessionStorage.getItem(STORAGE_API_KEY) || '').trim();

    if (savedBase) {
      setApiBase(savedBase);
    }

    if (savedKey) {
      setApiKey(savedKey);
      setAlertState({
        type: 'info',
        message: 'Sesión previa detectada. Pulsa "Conectar" para cargar datos.',
      });
    }
  }, []);

  const setBanner = useCallback((type, message) => {
    setAlertState({ type, message });
  }, []);

  const apiRequest = useCallback(
    async (path, options = {}) => {
      if (!connectionReady) {
        throw new Error('Conecta primero el panel con URL y llave interna.');
      }

      const method = options.method || 'GET';
      const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 15000;
      const body = options.body;

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`${apiBase}${path}`, {
          method,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${apiKey}`,
            ...(body ? { 'Content-Type': 'application/json' } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        const requestId = response.headers.get('X-Request-Id') || '';
        if (requestId) {
          setLastRequestId(requestId);
        }

        let payload = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || `Error HTTP ${response.status}`);
        }

        return payload;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error('La solicitud tardó demasiado. Verifica conexión e intenta de nuevo.');
        }
        throw error;
      } finally {
        window.clearTimeout(timeout);
      }
    },
    [apiBase, apiKey, connectionReady],
  );

  const loadMetrics = useCallback(async () => {
    const response = await apiRequest('/api/internal/metrics/summary');
    setMetrics(response.metrics || null);
  }, [apiRequest]);

  const loadReservations = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('limit', '200');

    if (reservationFilters.status) params.set('status', reservationFilters.status);
    if (reservationFilters.location) params.set('location', reservationFilters.location);
    if (reservationFilters.dateFrom) params.set('date_from', reservationFilters.dateFrom);
    if (reservationFilters.dateTo) params.set('date_to', reservationFilters.dateTo);

    const response = await apiRequest(`/api/internal/reservations?${params.toString()}`);
    setReservations(Array.isArray(response.reservations) ? response.reservations : []);
  }, [apiRequest, reservationFilters]);

  const loadNotifications = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('limit', '200');

    if (notificationFilters.status) params.set('status', notificationFilters.status);
    if (notificationFilters.channel) params.set('channel', notificationFilters.channel);

    const reservationId = String(notificationFilters.reservationId || '').trim();
    if (reservationId) params.set('reservation_id', reservationId);

    const response = await apiRequest(`/api/internal/notifications?${params.toString()}`);
    setNotifications(Array.isArray(response.notifications) ? response.notifications : []);
  }, [apiRequest, notificationFilters]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadMetrics(), loadReservations(), loadNotifications()]);
  }, [loadMetrics, loadReservations, loadNotifications]);

  const handleConnect = useCallback(async () => {
    const normalizedBase = normalizeBaseUrl(apiBase);
    const normalizedKey = String(apiKey || '').trim();

    if (!normalizedBase || !/^https?:\/\//i.test(normalizedBase)) {
      setBanner('error', 'Debes colocar una URL base valida para la API.');
      return;
    }

    if (!normalizedKey || normalizedKey.length < 16) {
      setBanner('error', 'Debes colocar una Internal API Key valida.');
      return;
    }

    setApiBase(normalizedBase);
    setApiKey(normalizedKey);
    setIsConnected(true);
    setIsBusy(true);
    setBanner('info', 'Conectando y sincronizando datos...');

    try {
      window.sessionStorage.setItem(STORAGE_BASE_KEY, normalizedBase);
      window.sessionStorage.setItem(STORAGE_API_KEY, normalizedKey);
      await Promise.all([loadMetrics(), loadReservations(), loadNotifications()]);
      setBanner('success', 'Panel conectado y sincronizado correctamente.');
    } catch (error) {
      setIsConnected(false);
      setBanner('error', error?.message || 'No se pudo conectar al panel interno.');
    } finally {
      setIsBusy(false);
    }
  }, [apiBase, apiKey, loadMetrics, loadNotifications, loadReservations, setBanner]);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setApiKey('');
    setMetrics(null);
    setReservations([]);
    setNotifications([]);
    setLastRequestId('N/A');
    window.sessionStorage.removeItem(STORAGE_BASE_KEY);
    window.sessionStorage.removeItem(STORAGE_API_KEY);
    setBanner('info', 'Panel desconectado.');
  }, [setBanner]);

  const handleRefreshAll = useCallback(async () => {
    if (!connectionReady) return;
    setIsBusy(true);
    setBanner('info', 'Actualizando datos...');
    try {
      await refreshAll();
      setBanner('success', 'Datos actualizados.');
    } catch (error) {
      setBanner('error', error?.message || 'No se pudieron actualizar los datos.');
    } finally {
      setIsBusy(false);
    }
  }, [connectionReady, refreshAll, setBanner]);

  const handleStatusChange = useCallback(
    async (reservationId, status) => {
      setIsBusy(true);
      try {
        await apiRequest(`/api/internal/reservations/${reservationId}/status`, {
          method: 'PATCH',
          body: {
            status,
            updated_by: 'admin_react_panel',
            note: `Actualizado desde panel React (${new Date().toISOString()})`,
            enqueue_notifications: true,
            dispatch_now: false,
          },
        });

        await Promise.all([loadMetrics(), loadReservations(), loadNotifications()]);
        setBanner('success', `Reserva #${reservationId} actualizada a ${formatReservationStatus(status)}.`);
      } catch (error) {
        setBanner('error', error?.message || 'No se pudo actualizar el estado de la reserva.');
      } finally {
        setIsBusy(false);
      }
    },
    [apiRequest, loadMetrics, loadReservations, loadNotifications, setBanner],
  );

  const handleNotifyReservation = useCallback(
    async (reservationId) => {
      setIsBusy(true);
      try {
        await apiRequest(`/api/internal/reservations/${reservationId}/notify`, {
          method: 'POST',
          body: {
            channels: ['email', 'whatsapp'],
            trigger: 'manual_react_panel',
            updated_by: 'admin_react_panel',
            dispatch_now: false,
          },
        });

        await Promise.all([loadMetrics(), loadNotifications()]);
        setBanner('success', `Notificaciones encoladas para reserva #${reservationId}.`);
      } catch (error) {
        setBanner('error', error?.message || 'No se pudo encolar la notificación.');
      } finally {
        setIsBusy(false);
      }
    },
    [apiRequest, loadMetrics, loadNotifications, setBanner],
  );

  const handleDispatch = useCallback(
    async (ids = []) => {
      setIsBusy(true);
      try {
        const parsedLimit = Number.parseInt(dispatchLimit, 10);
        const limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 50) : 20;

        const body = {
          limit,
          force: true,
        };

        if (Array.isArray(ids) && ids.length > 0) {
          body.ids = ids;
          body.limit = Math.max(1, Math.min(ids.length, 50));
        }

        const response = await apiRequest('/api/internal/notifications/dispatch', {
          method: 'POST',
          body,
        });

        await Promise.all([loadMetrics(), loadNotifications()]);

        const summary = response.summary || {};
        setBanner(
          'success',
          `Despacho completado: ${summary.sent || 0} sent, ${summary.failed || 0} failed, ${summary.requeued || 0} requeued.`,
        );
      } catch (error) {
        setBanner('error', error?.message || 'No se pudo despachar la cola.');
      } finally {
        setIsBusy(false);
      }
    },
    [apiRequest, dispatchLimit, loadMetrics, loadNotifications, setBanner],
  );

  const handleRetryNotification = useCallback(
    async (notificationId) => {
      setIsBusy(true);
      try {
        await apiRequest(`/api/internal/notifications/${notificationId}/retry`, {
          method: 'POST',
          body: {
            dispatch_now: true,
          },
        });

        await Promise.all([loadMetrics(), loadNotifications()]);
        setBanner('success', `Notificación #${notificationId} reintentada correctamente.`);
      } catch (error) {
        setBanner('error', error?.message || 'No se pudo reintentar la notificación.');
      } finally {
        setIsBusy(false);
      }
    },
    [apiRequest, loadMetrics, loadNotifications, setBanner],
  );

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ fontFamily: '"Bree Serif", serif' }}>
            Los Corales | Panel Interno
          </Typography>
          <Box sx={{ ml: 'auto' }}>
            <Chip size="small" color={connectionReady ? 'success' : 'default'} label={connectionReady ? 'Conectado' : 'Desconectado'} />
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={2.2}>
          <Grid size={{ xs: 12 }}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Conexión API interna
                </Typography>

                <Grid container spacing={1.2}>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <TextField
                      fullWidth
                      label="API base"
                      value={apiBase}
                      onChange={(event) => setApiBase(event.target.value)}
                      placeholder="https://...workers.dev"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Internal API Key"
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                      placeholder="Pega aquí la llave interna"
                    />
                  </Grid>
                </Grid>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.2 }}>
                  <Button variant="contained" disabled={isBusy} onClick={handleConnect} startIcon={<SyncRoundedIcon />}>
                    Conectar
                  </Button>
                  <Button variant="outlined" disabled={isBusy || !connectionReady} onClick={handleRefreshAll} startIcon={<RefreshRoundedIcon />}>
                    Refrescar
                  </Button>
                  <Button variant="outlined" color="secondary" disabled={isBusy || !connectionReady} onClick={handleDisconnect}>
                    Desconectar
                  </Button>
                </Stack>

                <Alert severity={alertState.type} sx={{ mt: 1.2 }}>
                  {alertState.message}
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Grid container spacing={1.2}>
              <Grid size={{ xs: 6, md: 2 }}>
                <MetricCard title="Pendientes" value={metrics?.reservations?.pending ?? 0} color="warning" />
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <MetricCard title="Confirmadas" value={metrics?.reservations?.confirmed ?? 0} color="success" />
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <MetricCard title="Canceladas" value={metrics?.reservations?.cancelled ?? 0} color="error" />
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <MetricCard title="Outbox queued" value={metrics?.notifications?.queued ?? 0} color="warning" />
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <MetricCard title="Ready dispatch" value={metrics?.notifications?.ready_to_dispatch ?? 0} color="primary" />
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <MetricCard title="Failed (24h)" value={metrics?.notifications?.failed_last_24h ?? 0} color="error" />
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1}>
                  <Typography variant="h5">Reservas ({reservations.length})</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Localidad, fecha, estado y acciones operativas
                  </Typography>
                </Stack>

                <Grid container spacing={1.1} sx={{ mt: 0.2, mb: 1.1 }}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Estado</InputLabel>
                      <Select
                        label="Estado"
                        value={reservationFilters.status}
                        onChange={(event) =>
                          setReservationFilters((prev) => ({
                            ...prev,
                            status: event.target.value,
                          }))
                        }
                      >
                        {RESERVATION_STATUS_OPTIONS.map((option) => (
                          <MenuItem key={option.value || 'all'} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Localidad</InputLabel>
                      <Select
                        label="Localidad"
                        value={reservationFilters.location}
                        onChange={(event) =>
                          setReservationFilters((prev) => ({
                            ...prev,
                            location: event.target.value,
                          }))
                        }
                      >
                        {LOCATION_OPTIONS.map((option) => (
                          <MenuItem key={option.value || 'all'} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <TextField
                      fullWidth
                      label="Desde"
                      type="date"
                      value={reservationFilters.dateFrom}
                      onChange={(event) =>
                        setReservationFilters((prev) => ({
                          ...prev,
                          dateFrom: event.target.value,
                        }))
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <TextField
                      fullWidth
                      label="Hasta"
                      type="date"
                      value={reservationFilters.dateTo}
                      onChange={(event) =>
                        setReservationFilters((prev) => ({
                          ...prev,
                          dateTo: event.target.value,
                        }))
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      disabled={!connectionReady || isBusy}
                      onClick={async () => {
                        setIsBusy(true);
                        try {
                          await loadReservations();
                          setBanner('success', 'Reservas actualizadas.');
                        } catch (error) {
                          setBanner('error', error?.message || 'No se pudieron cargar las reservas.');
                        } finally {
                          setIsBusy(false);
                        }
                      }}
                      sx={{ height: '56px' }}
                    >
                      Aplicar
                    </Button>
                  </Grid>
                </Grid>

                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 520 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Cliente</TableCell>
                        <TableCell>Contacto</TableCell>
                        <TableCell>Fecha/Hora</TableCell>
                        <TableCell>Localidad</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell width={390}>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {!reservations.length && (
                        <TableRow>
                          <TableCell colSpan={7}>Sin resultados para los filtros actuales.</TableCell>
                        </TableRow>
                      )}

                      {reservations.map((reservation) => (
                        <TableRow key={reservation.id} hover>
                          <TableCell>#{reservation.id}</TableCell>
                          <TableCell>{reservation.full_name || '-'}</TableCell>
                          <TableCell>
                            <Typography variant="body2">{reservation.phone || '-'}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {reservation.email || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatDateTime(reservation.reservation_date, reservation.reservation_time)}</TableCell>
                          <TableCell>{formatLocation(reservation.location)}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              color={statusChipColor(reservation.status)}
                              label={formatReservationStatus(reservation.status)}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<PendingActionsRoundedIcon />}
                                disabled={!connectionReady || isBusy}
                                onClick={() => handleStatusChange(reservation.id, 'pending')}
                              >
                                Pendiente
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                startIcon={<CheckCircleRoundedIcon />}
                                disabled={!connectionReady || isBusy}
                                onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                              >
                                Confirmar
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<CancelRoundedIcon />}
                                disabled={!connectionReady || isBusy}
                                onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<SendRoundedIcon />}
                                disabled={!connectionReady || isBusy}
                                onClick={() => handleNotifyReservation(reservation.id)}
                              >
                                Notificar
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1}>
                  <Typography variant="h5">Outbox de notificaciones ({notifications.length})</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      size="small"
                      type="number"
                      label="Lote despacho"
                      value={dispatchLimit}
                      onChange={(event) => setDispatchLimit(event.target.value)}
                      sx={{ minWidth: 140 }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<SendRoundedIcon />}
                      disabled={!connectionReady || isBusy}
                      onClick={() => handleDispatch([])}
                    >
                      Despachar cola
                    </Button>
                  </Stack>
                </Stack>

                <Grid container spacing={1.1} sx={{ mt: 0.2, mb: 1.1 }}>
                  <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Estado</InputLabel>
                      <Select
                        label="Estado"
                        value={notificationFilters.status}
                        onChange={(event) =>
                          setNotificationFilters((prev) => ({
                            ...prev,
                            status: event.target.value,
                          }))
                        }
                      >
                        {NOTIFICATION_STATUS_OPTIONS.map((option) => (
                          <MenuItem key={option.value || 'all'} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Canal</InputLabel>
                      <Select
                        label="Canal"
                        value={notificationFilters.channel}
                        onChange={(event) =>
                          setNotificationFilters((prev) => ({
                            ...prev,
                            channel: event.target.value,
                          }))
                        }
                      >
                        {NOTIFICATION_CHANNEL_OPTIONS.map((option) => (
                          <MenuItem key={option.value || 'all'} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Reserva ID"
                      value={notificationFilters.reservationId}
                      onChange={(event) =>
                        setNotificationFilters((prev) => ({
                          ...prev,
                          reservationId: event.target.value,
                        }))
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      disabled={!connectionReady || isBusy}
                      onClick={async () => {
                        setIsBusy(true);
                        try {
                          await loadNotifications();
                          setBanner('success', 'Notificaciones actualizadas.');
                        } catch (error) {
                          setBanner('error', error?.message || 'No se pudieron cargar las notificaciones.');
                        } finally {
                          setIsBusy(false);
                        }
                      }}
                      sx={{ height: '56px' }}
                    >
                      Aplicar
                    </Button>
                  </Grid>
                </Grid>

                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 520 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Reserva</TableCell>
                        <TableCell>Canal</TableCell>
                        <TableCell>Destino</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Intentos</TableCell>
                        <TableCell>Próximo intento</TableCell>
                        <TableCell>Error</TableCell>
                        <TableCell width={180}>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {!notifications.length && (
                        <TableRow>
                          <TableCell colSpan={9}>Sin resultados para los filtros actuales.</TableCell>
                        </TableRow>
                      )}

                      {notifications.map((notification) => (
                        <TableRow key={notification.id} hover>
                          <TableCell>#{notification.id}</TableCell>
                          <TableCell>#{notification.reservation_id}</TableCell>
                          <TableCell>{notification.channel || '-'}</TableCell>
                          <TableCell>{notification.recipient || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              color={statusChipColor(notification.status)}
                              label={formatNotificationStatus(notification.status)}
                            />
                          </TableCell>
                          <TableCell>{`${notification.attempts || 0}/${notification.max_attempts || 0}`}</TableCell>
                          <TableCell>{notification.next_attempt_at || '-'}</TableCell>
                          <TableCell>{notification.last_error || '-'}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                              {notification.status === 'queued' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<SendRoundedIcon />}
                                  disabled={!connectionReady || isBusy}
                                  onClick={() => handleDispatch([notification.id])}
                                >
                                  Despachar
                                </Button>
                              )}
                              {notification.status === 'failed' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<ReplayRoundedIcon />}
                                  disabled={!connectionReady || isBusy}
                                  onClick={() => handleRetryNotification(notification.id)}
                                >
                                  Retry
                                </Button>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Observabilidad
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Último Request ID: <strong>{lastRequestId}</strong>. Revisa eventos en Cloudflare: <code>http_request</code>,{' '}
                  <code>reservation_created</code>, <code>reservation_status_updated</code>, <code>notifications_dispatched</code>.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
