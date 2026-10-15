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
├── services/               Reservas (reservar, confirmar, pagar, cancelar) y autenticación
├── context/                Sesión del usuario
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

Para ver el pago rechazado, usa una tarjeta que termine en `0000`.
Cuentas de prueba: admin@gmail.com / admin123 y recepcion@gmail.com / recepcion.

## Pruebas

Vitest con jsdom y Testing Library. Mocks: `localStorage` en memoria y reloj controlado
con `vi.useFakeTimers()`. 26 pruebas sobre las reglas de negocio (reserva, confirmación, cancelación
automática, reembolsos, planes, pagos, cupos críticos, reportes y usuarios) y sobre los componentes
(renderizado, props, estado y eventos). La cobertura se mide solo sobre los archivos que decidimos
probar (ver `vite.config.js`).
