# Browser Compatibility y QA

Este proyecto esta optimizado para navegadores modernos en mobile y desktop.

## Soporte objetivo

- iOS Safari (ultimas 2 versiones)
- Chrome Android (ultimas 2 versiones)
- Chrome Desktop (ultimas 2 versiones)
- Edge Desktop (ultimas 2 versiones)
- Firefox Desktop (ultimas 2 versiones)
- Safari macOS (ultimas 2 versiones)

## Hardening aplicado

- Fallback de viewport: `min-height: 100vh` + `100dvh`.
- Fallback Safari para blur: `-webkit-backdrop-filter`.
- Ajuste anti-zoom iOS: `text-size-adjust` y `font-size: 16px` en inputs mobile.
- Cache busting consistente de `main.css` y `main.js` en todas las paginas.

## Validacion automatizada (capturas)

Generar capturas mobile de `index`, `menu` y `reserva` en Chromium/Firefox/WebKit:

```bash
./scripts/qa_cross_browser_screenshots.sh
```

Salida:

- `docs/qa/screenshots-YYYYMMDD-HHMMSS/`

## Checklist manual antes de entregar

1. Navegacion abre/cierra con icono hamburguesa en mobile.
2. Portada no comprime texto en columna estrecha.
3. Footer no tapa contenido principal.
4. Modulo Menu renderiza sin cortes ni superposiciones raras.
5. Formulario Reserva no hace zoom agresivo en iOS al enfocar campos.
