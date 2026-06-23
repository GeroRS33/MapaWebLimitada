WEB - Mapa de Puntos de Venta

Objetivo

Desarrollar una web simple para que clientes, instaladores y ferreterías puedan encontrar puntos de venta WEB en Uruguay.

La aplicación debe centrarse exclusivamente en la búsqueda de locales y visualización de su ubicación en un mapa.

No debe funcionar como una landing comercial ni como una tienda online.

⸻

Referencias de Diseño

Tomar como referencia principal los archivos:

* Desktop-Reference.jpg
* Mobile-Reference.jpg

La implementación final debe respetar la estructura visual, distribución de elementos y experiencia de usuario mostrada en dichas imágenes.

Las referencias no son inspiración general; son el objetivo visual del proyecto.

⸻

Identidad Visual

Color institucional principal:

* #2E3192

La aplicación debe mantener una estética limpia, simple y funcional.

El mapa debe ser el elemento protagonista de la experiencia.

⸻

Recursos Gráficos

Todos los recursos gráficos se encuentran dentro de la carpeta:

Elementos Gráficos

Utilizar exclusivamente los SVG proporcionados.

No reemplazar estos recursos por iconos de librerías externas salvo que sea estrictamente necesario.

Asignación sugerida:

* LogoWeb.svg → Logo principal del header
* Icono-Ubicacion.svg → Icono junto al texto “Puntos de Venta”
* Icono-Ubicacion-Azul.svg → Pin principal del mapa
* Icono-MiUbicacion.svg → Botón “Usar mi ubicación”
* Icono-Local.svg → Nombre del local en la tarjeta
* Icono-Direccion.svg → Dirección del local
* Icono-Telefono.svg → Teléfono del local
* Icono-ComoLlegar.svg → Botón “Cómo llegar”

⸻

Datos

Los datos de los locales se encuentran en:

Locales-Prueba.xlsx

Columnas:

* ID
* Nombre
* Dirección
* Localidad/Ciudad
* Departamento
* Teléfono
* Latitud
* Longitud

Para esta primera versión utilizar exclusivamente los datos del archivo Excel adjunto.

La estructura del proyecto debe quedar preparada para que en el futuro los datos puedan provenir de Google Sheets o de una base de datos.

⸻

Tecnologías

Preferentemente:

* React
* Leaflet
* OpenStreetMap

No utilizar Google Maps.

⸻

Funcionalidades

Mapa

* Mostrar todos los locales disponibles mediante pins.
* Centrar inicialmente el mapa en Uruguay.
* Permitir zoom y desplazamiento libre.
* Preparar la estructura para soportar más de 1000 puntos en el futuro.

Búsqueda

Permitir búsqueda por:

* Nombre
* Dirección
* Localidad/Ciudad
* Departamento

Comportamiento esperado:

* Mostrar sugerencias mientras el usuario escribe.
* Al seleccionar un resultado:
    * Centrar el mapa en el local.
    * Aplicar zoom.
    * Abrir automáticamente la tarjeta informativa del punto.

No utilizar filtros en esta primera versión.

La búsqueda debe comportarse de forma similar a Google Maps.

Tarjeta del Local

Al seleccionar un punto o resultado de búsqueda mostrar:

* Nombre
* Dirección
* Teléfono

Además incluir un botón:

“Cómo llegar”

Este botón debe abrir Google Maps utilizando las coordenadas del local.

Usar mi ubicación

Agregar un botón:

“Usar mi ubicación”

Al presionarlo:

* Solicitar permiso al usuario.
* Obtener ubicación actual.
* Centrar el mapa en dicha ubicación.

Ir a Montevideo

Agregar un acceso rápido:

“Ir a Montevideo”

Debe centrar el mapa sobre Montevideo.

⸻

Responsive

Desktop

* Header superior azul.
* Buscador debajo del header.
* Mapa ocupando prácticamente toda la pantalla.
* Tarjeta informativa flotante lateral.

Mobile

* Header superior azul.
* Buscador debajo del header.
* Mapa ocupando toda la pantalla.
* Tarjeta informativa inferior tipo bottom sheet.

⸻

Escalabilidad

El objetivo final es soportar aproximadamente 1000 puntos de venta.

Por ese motivo la arquitectura debe quedar preparada para implementar clustering de puntos en una etapa posterior.

No es obligatorio implementar clustering en esta primera versión si afecta los tiempos de desarrollo, pero la estructura debe contemplarlo.

⸻

Objetivo de esta Primera Entrega

Validar:

* Lectura correcta de los datos.
* Visualización de locales en el mapa.
* Funcionamiento de la búsqueda.
* Funcionamiento de la tarjeta informativa.
* Funcionamiento responsive en desktop y mobile.
* Fidelidad visual respecto a las referencias proporcionadas.