# Checklist para clienta (Correo + WhatsApp Business API)

Documento para pedir a la clienta todo lo necesario antes de conectar reservas por correo y WhatsApp.

## Mensaje sugerido para enviarle

Hola [Nombre],

Para activar reservas automaticas por correo y WhatsApp Business API, necesito estos datos:

1. Correo de reservas:
   - Cuenta remitente (ejemplo: `reservas@tudominio.com`).
   - Correo(s) destino donde llegaran notificaciones.
   - Proveedor (Google Workspace, Zoho, Microsoft, etc).
   - Credenciales SMTP o API key segun el proveedor.
2. WhatsApp Business API:
   - Meta Business Portfolio ID.
   - WhatsApp Business Account ID.
   - Phone Number ID (numero conectado a la API).
   - Access token de sistema (permanente o de larga duracion).
   - Numero destino interno del negocio para recibir alertas (formato internacional, ejemplo: `+1809...`).
3. Validaciones:
   - Confirmar que el negocio esta verificado en Meta Business Manager.
   - Confirmar que el nombre para mostrar del numero fue aprobado.
   - Confirmar que el numero no esta bloqueado en otra integracion incompatible.
4. Dominio:
   - Dominio final que usaremos para conectar sitio, correo y seguridad DNS.
   - Acceso al panel DNS (temporal o por llamada guiada) para registros SPF/DKIM/DMARC y verificaciones.

Con estos datos dejo la integracion activa end-to-end.

## Entregables minimos por canal

### Correo

- `EMAIL_FROM`
- `EMAIL_TO`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` (`true`/`false`)
- `SMTP_USER` (si aplica)
- `SMTP_PASS` (si aplica)

### WhatsApp Business API

- `WABA_PHONE_NUMBER_ID`
- `WABA_ACCESS_TOKEN`
- `WABA_TO_NUMBER`
- `WABA_API_VERSION`

## Nota importante

Si se desea conversacion bidireccional real (cliente responde por WhatsApp y el sistema procesa respuesta), ademas se requiere:

- webhook publico HTTPS,
- endpoint para eventos entrantes,
- token de verificacion del webhook,
- logica de enrutamiento de conversaciones.
