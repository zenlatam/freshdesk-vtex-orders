# VTEX-FDesk: Integración de Órdenes en Freshdesk

Este proyecto es una aplicación personalizada para Freshdesk que permite visualizar, desde la barra lateral de tickets, el nombre del solicitante y el detalle de sus órdenes provenientes de VTEX. Incluye un modal interactivo para mostrar información relevante de cada orden.

## Características
- Muestra el nombre del solicitante del ticket en Freshdesk.
- Permite consultar y visualizar órdenes asociadas a un contacto (ejemplo: por RUT).
- Modal personalizado con detalles de cada orden, incluyendo productos, estado y datos de envío.
- Código modular y documentado para fácil mantenimiento y extensión.

## Estructura de Carpetas
```
.
├── README.md                 Documentación principal del proyecto
├── app                       Recursos frontend
│   ├── index.html            Página principal de la app
│   ├── scripts               Lógica de negocio frontend
│   │   ├── app.js            Integración con Freshdesk y eventos
│   │   └── modal.js          Lógica y visualización de órdenes en el modal
│   └── styles                Estilos CSS
│       ├── images            Imágenes y recursos gráficos
│       └── style.css         Estilos generales
├── config                    Archivos de configuración
│   ├── iparams.json          Parámetros de instalación/configuración
│   └── requests.json         Plantillas de requests
├── manifest.json             Metadatos para la plataforma Freshdesk
└── views                     Vistas HTML para modales y detalles
    ├── detalle_orden.html    Vista de detalle de orden
    └── modal.html            Vista del modal principal
```

## Configuración Inicial (iparams)
Para que la app funcione correctamente, debes configurar los siguientes parámetros en la instalación:

| Parámetro   | Descripción                                                                 | Ejemplo                                               | Obligatorio |
|-------------|-----------------------------------------------------------------------------|-------------------------------------------------------|-------------|
| base_url    | La URL base de la tienda VTEX.                                             | https://tiendaurl.vtexcommercestable.com.br           | Sí          |
| app_key     | App Key de VTEX para autenticación API.                                    | vtex-app-key-123456                                   | Sí          |
| app_token   | App Token de VTEX para autenticación API (se recomienda mantenerlo seguro).| vtex-app-token-abcdef                                 | Sí          |

Estos parámetros se solicitan al instalar la app en Freshdesk y se utilizan para autenticar y realizar las consultas a la API de VTEX.

## Instalación y Uso
1. Clona este repositorio en tu máquina local.
2. Instala el [Freshworks CLI (FDK)](https://developers.freshworks.com/docs/cli/quick-start/).
3. Ejecuta `fdk run` en la raíz del proyecto para iniciar la app en modo desarrollo.
4. Sigue las instrucciones de Freshdesk para instalar la app personalizada en tu cuenta.

## Personalización
- Modifica los archivos en `app/scripts/` para adaptar la lógica de negocio.
- Cambia los estilos en `app/styles/` según la identidad visual de tu empresa.
- Actualiza las vistas HTML en `views/` para personalizar la interfaz del modal.

## Créditos y Recursos
- Basado en la plataforma [Freshdesk](https://freshdesk.com/) y [VTEX](https://vtex.com/).
- Más ejemplos y documentación en el [repositorio oficial de Freshworks](https://community.developers.freshworks.com/t/freshworks-sample-apps/3604).

---

© 2025 CocaCola / Zen. Proyecto de integración VTEX-FDesk.
"# freshdesk-vtex-orders"
