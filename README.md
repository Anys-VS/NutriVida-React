# NutriVida — React + Vite

Frontend de la Clínica Nutricional NutriVida con React, Vite, Bootstrap y React Router.
Los datos se simulan en
`src/data/db.js` (CRUD sobre localStorage).

## Requisitos

Node 20.19 o superior (el proyecto incluye `.nvmrc` con Node 22: `nvm use`).

## Comandos

```bash
npm install
npm run dev            # servidor de desarrollo
npm test               # pruebas unitarias con Vitest
npm run test:coverage  # pruebas + reporte de cobertura (carpeta coverage/)
npm run build          # versión de producción en dist/
```

## Estructura

```
src/
├── config/reglas.js        Parámetros, estados y roles de las reglas de negocio
├── domain/                 Lógica pura: citas, reembolsos, precios, pagos, validaciones
├── data/                   Catálogo, usuarios, regiones, sesión y base de datos simulada (CRUD)
├── services/               Reservas, carrito y órdenes, planes, fichas clínicas, usuarios y autenticación
├── context/                Sesión del usuario y carrito
├── components/             Navbar, Footer, tarjetas, formularios y campos reutilizables
├── layouts/ y pages/       Vistas (rutas)
├── styles/estilos.css      Diseño Nutri Vida de la Evaluación 1
└── test/                   Mocks y configuración de pruebas
```

## Vistas de esta etapa

**Tienda:** Inicio, Servicios (con filtro), Categorías, Ofertas, Detalle, Reservar, Checkout
(pago online simulado o en clínica), Reserva confirmada, Pago con error, Login, Registro, Mis citas,
Nosotros, Contacto y Blog (con dos artículos).

**Administración (`/admin`):** Resumen con métricas, Citas (marcar asistencia, registrar pagos y
reembolsos), Planes contratados, Productos y servicios (con cupos, sesiones y descuento), Categorías,
Cupos críticos, Reportes, Usuarios (con historial) y Mi perfil. El rol Recepción solo accede a Citas
y a su perfil.

**Planes:** se pagan completos online, traen un número de sesiones y se agendan de a una desde
Mis citas sin volver a pagar. Una sesión atendida descuenta del saldo; una cancelada o con
inasistencia vuelve a él. Cancelar el plan devuelve el 80% solo si ninguna sesión fue atendida.
Un plan sin `sesiones` definidas en el catálogo no se puede contratar.

**Reembolsos:** siempre los registra el administrador, ya sea que la cita termine en inasistencia,
la cancele recepción o la cancele el paciente a tiempo.

**Correcciones de la Evaluación 2 y requisitos del caso:**

- **Buscador de especialistas** (`/especialistas`, enlace Especialistas del menú): filtra por nombre,
  especialidad u objetivo (sin importar tildes), por especialidad y por día de atención; muestra los
  próximos horarios libres y lleva a "Reservar con este profesional".
- **Horarios reales** de cada nutricionista (`data/nutricionistas.js`): solo se ofrecen bloques dentro
  de su jornada. Sin preferencia, la clínica asigna al primer nutricionista libre.
- **Carrito** (`/carrito`): se agregan citas y planes con su fecha, hora y motivo; se paga lo marcado
  ("Pagar seleccionados") o todo ("Pagar todo") en una sola orden, con comprobante (`/orden/:id`).
  Antes de cobrar se revisa cada ítem: si alguno ya no está disponible no se cobra nada.
  Un paciente no puede tener dos atenciones a la misma hora; máximo 10 ítems.
  En Mis citas también se pueden pagar juntas varias citas con pago pendiente.
- **Motivo de consulta** y **nutricionista preferido** al reservar; **reprogramar** una cita hasta
  2 h antes, conservando el pago.
- **Rol Nutricionista** (`/admin/agenda` y `/admin/pacientes`): ve solo su agenda y sus pacientes,
  marca asistencia y registra mediciones, objetivo y plan alimenticio en la ficha.
- **Mi progreso** (paciente): mediciones, gráfico de peso, IMC y plan alimenticio.
- **Privacidad:** solo el paciente y su nutricionista ven la ficha clínica.
- **Desactivar usuarios** desde Usuarios: no pueden iniciar sesión y su historial se conserva.
- **Mapa** de la clínica con Leaflet en Contacto, con "Usar mi ubicación" y "Cómo llegar".

Para ver el pago rechazado, usa una tarjeta que termine en `0000`.

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@gmail.com | admin123 |
| Recepción | recepcion@gmail.com | recepcion |
| Nutricionista | carolina.fuentes@nutrivida.cl (también rodrigo.sepulveda, daniela.morales, felipe.araya) | nutri123 |
| Paciente (con ficha de ejemplo) | paciente@gmail.com | paciente1 |

Si ya usaste la app antes, borra el almacenamiento del sitio (o `localStorage.clear()` en la consola)
para que se carguen las cuentas y fichas nuevas.

## Pruebas

Vitest con jsdom y Testing Library. Mocks: `localStorage` en memoria y reloj controlado
con `vi.useFakeTimers()`. 47 pruebas sobre las reglas de negocio (reserva, confirmación, cancelación
automática, reembolsos, planes, pagos, cupos críticos, reportes, usuarios, carrito, reprogramación,
buscador, horarios reales y fichas clínicas) y sobre los componentes (renderizado, props, estado y
eventos, incluido el menú según el rol). La cobertura se mide solo sobre los archivos que decidimos
probar (ver `vite.config.js`).
