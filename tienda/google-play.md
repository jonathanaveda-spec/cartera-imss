# Google Play — Cartera Asesor

Guía y materiales para publicar en Google Play. **Preparada por Andrea el jueves 08/10/2026** para que Jonathan abra la cuenta el **sábado 10/10**.
Todo lo que dice «Jonathan» es con su cuenta, su tarjeta o su identificación: lo hace él. «Emma» prepara, guía y sube a GitHub.
Los textos de la ficha son de Julieta (ya corregidos). Las fuentes oficiales están al final, con la fecha en que las leí (08/10/2026).

**Decisiones ya tomadas:** cuenta de desarrollador **personal** (decisión del 01/10), con nombre visible **NeuroProyectos IA**.
La app se empaqueta como **TWA** (la web `carteraasesor.com/app` dentro de una app Android), con PWABuilder.

---

## 1. Lista de pasos (✅ hecho · ⬜ falta)

### Ya está listo (no hay que hacer nada)
| | Qué | Dónde |
|---|---|---|
| ✅ | Textos de la ficha: título, descripción corta y larga (Julieta) | sección 7 de este archivo |
| ✅ | 6 capturas de teléfono 1080×1920, 24 bits sin transparencia. La `6-pin.png` ya dice «Pídele PIN o huella a quien tome tu teléfono» | `tienda/capturas/` |
| ✅ | Gráfico de funciones 1024×500 con la marca (Bricolage Grotesque + Plus Jakarta Sans), 24 bits sin transparencia (hecho hoy) | `tienda/grafico-funciones.png` (se rehace desde `tienda/grafico.html`) |
| ✅ | Ícono 512×512, PNG de 32 bits con transparencia, 321 KB (el máximo es 1024 KB) (hecho hoy desde el ícono de la app) | `tienda/icono-play-512.png` |
| ✅ | Ícono (512) e imagen de encabezado (4096×2304) del **perfil del desarrollador** NeuroProyectos IA | `empresa/puente-digital/google-play/` (solo se usan después de publicar, ver sección 9) |
| ✅ | Aviso de privacidad en línea (responde 200) | https://carteraasesor.com/app/privacidad.html |
| ✅ | Versión de Play sin precios ni medios de pago (`?origen=play`) | `plataforma/js/origen.js` |
| ✅ | Lugar del archivo que une la web con la app: `sitio/.well-known/assetlinks.json` (por ahora vacío `[]`; se llena el sábado) | `sitio/.well-known/` |
| ✅ | Página «Eliminar mi cuenta» para Google (hecha hoy; **falta publicarla**, ver paso V2) | `sitio/eliminar-cuenta.html` |
| ✅ | Clientes inventados para la cuenta de prueba del revisor (hechos hoy) | `tienda/cuenta-prueba/clientes-demo.xlsx` (se regenera con `node tools/clientes-demo-revisor.mjs`) |

### Viernes 09/10 — preparación (30–45 min en total)
| | Paso | Quién | Tiempo | Costo |
|---|---|---|---|---|
| ⬜ V1 | Emma revisa lo que preparó Andrea (hay cosas por revisar, ver «Pendientes para Emma» al final), hace commit y push a los dos remotos | Emma | 10 min | 0 |
| ⬜ V2 | Emma comprueba **en línea**: `https://carteraasesor.com/.well-known/assetlinks.json` debe mostrar `[]` (200, tipo JSON) y `https://carteraasesor.com/eliminar-cuenta.html` debe abrir. Si el primero da 404, ver sección 3 («Si el archivo no sale») | Emma | 5 min | 0 |
| ⬜ V3 | Crear en Cloudflare la dirección **revisor@carteraasesor.com** que reenvíe a su Gmail (Email Routing → Direcciones personalizadas). Sirve para la cuenta de prueba del revisor (sección 5). Alternativa sin Cloudflare: usar `jonathanaveda+revisor@gmail.com` | Jonathan | 3 min | 0 |
| ⬜ V4 | Lista de **12 a 15 Gmail de asesores con Android** (mejor 15–20: algunos se salen). Empezar a avisarles que el domingo/lunes recibirán un enlace para probar la app | Jonathan | 15 min | 0 |
| ⬜ V5 | Ensayo del empaquetado (opcional, recomendado): Emma corre PWABuilder con una llave desechable para ver cómo sale y qué nivel de Android (API) trae (ver sección 2, **riesgo importante**) | Emma | 20 min | 0 |

### Sábado 10/10 — cuenta de desarrollador (Jonathan)
Orden pensado para que Google verifique mientras tú avanzas con lo demás. **Tiempo del bloque: unas 1–2 horas de trabajo tuyo, más la espera de Google** (no encontré en la ayuda oficial cuánto tarda la verificación; no lo prometo).
| | Paso | Quién | Tiempo | Costo |
|---|---|---|---|---|
| ⬜ S1 | Entrar a https://play.google.com/console con el Gmail elegido (con verificación en dos pasos) y crear la cuenta de desarrollador tipo **Personal** | Jonathan | 10 min | — |
| ⬜ S2 | Llenar los datos (tabla de la sección 8): **Nombre del desarrollador = NeuroProyectos IA**, nombre legal y dirección como en tu identificación, correo público soporte@carteraasesor.com, teléfono de la línea de la marca | Jonathan | 10 min | — |
| ⬜ S3 | **Pagar la cuota de registro: US$25, una sola vez.** Tarjeta Visa, Mastercard o American Express (**no prepago**), a tu nombre | Jonathan | 5 min | **US$25** |
| ⬜ S4 | **Verificar tu identidad:** subir tu identificación oficial si Google la pide. El nombre y la dirección del documento deben ser **idénticos** a los de tu perfil de pagos de Google | Jonathan | 10 min + espera | 0 |
| ⬜ S5 | **Verificar que tienes un celular Android real:** en la página principal de Play Console, tarea «Verificar que tienes acceso a un dispositivo móvil Android» → escanear el QR → abrir la app **Play Console** en el celular, iniciar sesión con la misma cuenta y tocar **Verificar**. Sirve un Android 10 o más nuevo, sin root | Jonathan | 5 min | 0 |
| ⬜ S6 | Verificar teléfono y correo de contacto (Google manda códigos de 6 dígitos). Los pide **después** de la identidad y del dispositivo | Jonathan | 5 min | 0 |

Mientras Google revisa, **se puede seguir con S7–S12** (puedes crear la app y subir borradores; lo que no puedes es *enviar a revisión* hasta que la cuenta esté verificada).

### Sábado 10/10 — empaquetar la app y preparar la ficha
| | Paso | Quién | Tiempo | Costo |
|---|---|---|---|---|
| ⬜ S7 | **Empaquetar con PWABuilder** (sección 2). Guardar el .zip **fuera del repositorio** (por ejemplo `Documentos\NeuroProyectos-llaves\`) y copia en tu Drive privado o gestor de contraseñas | Jonathan + Emma | 20 min | 0 |
| ⬜ S8 | Probar el **.apk** del paquete en tu celular Android (sección 2, lista de pruebas) | Jonathan (Emma guía) | 15 min | 0 |
| ⬜ S9 | En Play Console: **Crear app** (nombre «Cartera Asesor», idioma Español (Latinoamérica), App, Gratuita) y aceptar las declaraciones del programa para desarrolladores | Jonathan | 5 min | 0 |
| ⬜ S10 | Contenido de la app (secciones 4 y 5): política de privacidad, acceso a la app (cuenta de prueba), anuncios, clasificación, público objetivo, **Seguridad de los datos**, funciones financieras, eliminación de cuenta | Jonathan (Emma lee las respuestas en voz alta) | 40 min | 0 |
| ⬜ S11 | Ficha principal: copiar textos (sección 7) y subir ícono, gráfico y 6 capturas (sección 6). Categoría **Empresa**; correo soporte@carteraasesor.com; sitio https://carteraasesor.com | Jonathan | 25 min | 0 |
| ⬜ S12 | **Prueba cerrada:** Probar y publicar → Pruebas → Prueba cerrada → crear pista → subir el **.aab** → lista de testers (los 12–15 Gmail) → notas de la versión → **guardar y enviar a revisión** (esto último lo hace Jonathan) | Jonathan | 25 min | 0 |
| ⬜ S13 | **Huella de la llave de Google:** Play Console → Probar y publicar → Configuración → **Integridad de la app** → Firma de apps → copiar «Huella digital del certificado SHA-256» de la **clave de firma de la app**. Se la pasa a Emma (no es secreta: va pública en la web) | Jonathan → Emma | 5 min | 0 |
| ⬜ S14 | Emma pone la huella en `sitio/.well-known/assetlinks.json`, push, y comprueba que quedó en línea (sección 3) | Emma | 10 min | 0 |

### Después del sábado
| | Paso | Quién | Fecha / tiempo |
|---|---|---|---|
| ⬜ D1 | Google revisa la versión de la prueba cerrada. Cuando la apruebe, Play Console da el **enlace de unión** para testers | Google | no encontré plazo oficial; cuenta con 1–3 días |
| ⬜ D2 | Jonathan manda el enlace a los 12–15 testers por WhatsApp (Julieta redacta el mensaje). Cada uno lo abre **con su Gmail en su Android**, toca «Ser tester» e instala la app de Play | Jonathan | en cuanto D1 |
| ⬜ D3 | **14 días seguidos** con al menos **12 testers inscritos continuamente**. Si alguien se sale, esos días no cuentan para él. Pedirles que abran la app algunas veces (Google mira que haya participación) | Testers | si todos entran el lunes 12/10, el día 14 es el lunes **26/10** (si entran más tarde, se corre) |
| ⬜ D4 | **Solicitar acceso a producción** (Panel → «Solicitar producción»). Son 3 partes de preguntas: sobre la prueba, sobre la app y sobre si está lista (Julieta ayuda con las respuestas) | Jonathan | cuando se cumplan los 14 días |
| ⬜ D5 | Google responde la solicitud: «normalmente 7 días o menos, a veces más» | Google | ~1 semana |
| ⬜ D6 | Crear la versión de **producción** y enviarla a revisión; al aprobarse, la app sale en Google Play | Jonathan | fecha estimada: **primera semana de noviembre** si todo sale a la primera |
| ⬜ D7 | Después de publicar: completar la página de desarrollador (ver `empresa/puente-digital/google-play/LEEME.md`) | Jonathan | 15 min |

**Aviso para Victoria/Lucía:** con estas fechas, la prueba cerrada **no estará abierta el miércoles 14/10** (M03) y es poco probable para el sábado 17/10 (M06). Mejor usar los videos de reserva y poner M03/M06 cuando ya haya enlace de testers.

---

## 2. Empaquetado: de PWA a app de Android

**Idea en una frase:** la app de Play es una «ventana» (TWA = Trusted Web Activity) que abre `carteraasesor.com/app` a pantalla completa, sin barra de navegador. Los datos y la lógica siguen siendo los de la web, así que cada mejora que se publique en GitHub llega también a la app de Play **sin subir una versión nueva a la tienda**.

### Ruta recomendada (la más simple): PWABuilder
1. Entrar a https://www.pwabuilder.com e ingresar `https://carteraasesor.com/app/`. Revisar que muestre el manifiesto y el service worker en verde.
2. Elegir **Package for stores → Android → Google Play**. Valores (los nombres de las casillas pueden cambiar; lo que no entiendas se deja como viene):
   - **Package ID:** `com.carteraasesor.app` (**no se puede cambiar nunca** después de publicar).
   - **App name:** Cartera Asesor · **Launcher name:** Cartera · **Versión:** 1.0.0 · **Version code:** 1.
   - **Host:** `carteraasesor.com` · **Start URL:** `/app/?origen=play` (esto activa la versión de Play, sin precios).
   - **Colores y íconos:** los toma del manifiesto (azul `#0b2a6f`; ya hay ícono *maskable*).
   - **Notification delegation:** activada (para el aviso diario).
   - **Signing key:** **Create new** (primera vez). PWABuilder crea la llave y la mete en el .zip.
3. Descargar el .zip. Trae, según la documentación del propio PWABuilder: el **.aab** (se sube a Play), un **.apk** (para probar en tu celular), `signing.keystore` + `signing-key-info.txt` (la **llave y sus contraseñas**) y un `assetlinks.json`.
4. **La llave (`signing.keystore`) y `signing-key-info.txt` NUNCA van a GitHub.** Guárdalos fuera de la carpeta del proyecto, con copia en tu Drive privado o gestor de contraseñas. El `.gitignore` ya bloquea `*.keystore`, `*.jks`, `*.aab`, `*.apk` y `signing-key-info*` (agregué estos últimos hoy). Con **Play App Signing**, Google guarda la llave final de la app y tu llave de PWABuilder queda como «llave de subida»; aun así, **guárdala bien**.

### RIESGO IMPORTANTE: el nivel de Android (API) del paquete
- Google Play exige que las **apps nuevas** apunten a **Android 16 (API 36)**; la fecha límite fue el **31/08/2026**. La prórroga a 01/11/2026 que menciona la ayuda es para quien «necesite más tiempo» y se pide dentro de Play Console; no cuento con ella para una app nueva.
- Un aviso público en el repositorio de PWABuilder (21/07/2026) decía que su plantilla **todavía apuntaba a API 35**. No pude comprobar si ya lo arreglaron. **Si el .aab sale con API 35, Play Console lo rechazará al subirlo.**
- **Cómo se verifica:** (a) el ensayo del viernes (V5), o (b) subir el .aab el sábado: Play Console avisa antes de enviar a revisión.
- **Plan B si sale con API 35** (lo prepara Emma el viernes para no perder el sábado): generar el paquete con **Bubblewrap** (la herramienta de Google que usa PWABuilder por dentro; hace falta Node, que está en la PC del local, más Java y el SDK de Android que Bubblewrap puede descargar solo) subiendo el nivel a 36; o con Android Studio. Es la única parte técnica difícil del plan; por eso pido el ensayo.

### Qué probar en el .apk antes de subirlo (S8)
Instalar el .apk en tu Android y revisar: entra sin barra de dirección (si aparece una barra, es porque falta `assetlinks.json` con la huella; es normal en el .apk firmado con la llave de PWABuilder hasta que se agregue esa huella, ver sección 3); crear cuenta/iniciar sesión; PIN y huella; botón de WhatsApp; **Importar Excel** (selector de archivos); **descargar respaldo/Excel**; aviso diario; botón «atrás» de Android; abrir sin internet. Si algo falla solo en la app, avisarle a Tere/Emma antes de enviar a revisión.

### Riesgo de política: «app que solo es una web»
Google no permite apps cuya función principal sea mostrar una página web **sin permiso del dueño del sitio** (el dueño eres tú, no hay problema) y exige un mínimo de funcionalidad y calidad (política «Spam, funcionalidad mínima»). Cartera Asesor tiene funciones propias (cartera, pagos, importación, PIN y huella, funciona sin internet), así que el riesgo es bajo. Lo importante: que **abra y funcione sin errores** y que la cuenta de prueba entre sin problemas.

---

## 3. Qué necesita el sitio: `/.well-known/assetlinks.json`

**Para qué sirve:** Android comprueba que `carteraasesor.com` y la app son del mismo dueño. Si no coincide, la app se abre **con la barra del navegador arriba** (se ve menos «app»). Es lo que Android busca: `https://carteraasesor.com/.well-known/assetlinks.json`, por HTTPS, sin redirecciones, tipo `application/json`.

**Dónde va en este proyecto:** `sitio/.well-known/assetlinks.json`. El flujo de publicación (`.github/workflows/pages.yml`) hace `cp -r sitio/. _site/`, con el punto final, que **sí copia carpetas ocultas**, y usa `upload-pages-artifact@v3`, que no las excluye (la exclusión de archivos ocultos llegó en la v4 y se arregla con `include-hidden-files: true` en la v5, según los lanzamientos oficiales). **No hay que tocar `pages.yml`.** Si algún día se sube esa acción de versión, hay que agregar esa opción o el archivo dejará de publicarse.

**Hoy** el archivo es `[]` (lista vacía, JSON válido). Sirve para **probar la tubería ahora**: después del push, la dirección debe responder 200.

**El sábado (S14),** Emma lo deja así (la huella es la de «clave de firma de la app» de Play Console; se pueden poner varias separadas por coma):
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.carteraasesor.app",
      "sha256_cert_fingerprints": [
        "AA:BB:...:FF   (huella de la CLAVE DE FIRMA DE LA APP, Play Console → Integridad de la app)",
        "AA:BB:...:FF   (opcional: huella de la llave de PWABuilder, solo para probar el .apk instalado a mano; está en signing-key-info.txt)"
      ]
    }
  }
]
```
- Son 32 pares de letras/números con dos puntos. **La huella no es secreta** (va pública en la web). **Lo secreto es la llave.**
- Después de publicar, comprobar con el probador de Google (https://developers.google.com/digital-asset-links/tools/generator) o con `curl -s https://carteraasesor.com/.well-known/assetlinks.json`.
- Android guarda el archivo; según la documentación de Android, un cambio **puede tardar hasta 7 días en llegar a los teléfonos con Android 15 o más nuevo**. Por eso hay que dejarlo bien **antes** de que los testers instalen. Si la app abre con barra de direcciones, casi siempre es la huella equivocada o que aún no se publicó.
- **Si el archivo no sale** (404 después del push): revisar que el paso «Armar el sitio» del flujo lo copió (en la pestaña Actions) y que no se subió la acción de versión; como solución rápida, `include-hidden-files: true` en el paso de `upload-pages-artifact` (solo v5).

---

## 4. Formulario «Seguridad de los datos» (respuestas según la verdad)

**Reglas del formulario (ayuda oficial de Play, consultada el 08/10/2026):** hay que llenarlo aunque no se recopile nada; la política de privacidad es obligatoria; «recopilar» = datos que **salen del teléfono**, aunque los guarde Google; «compartir» = pasarlos a un tercero, **excepto** a un **proveedor de servicios** que los procesa solo por tu cuenta y con tus instrucciones. Eres responsable de que sea exacto y completo; si cambia la app, se actualiza.

**Cómo funciona Cartera Asesor (verificado en el código y en `firestore.rules`):** el asesor crea cuenta con correo y contraseña (Firebase Auth), y su cartera se guarda en su espacio privado de Firestore (Google). No hay publicidad, ni analítica de terceros, ni SDK de redes sociales. Los mensajes de WhatsApp los manda el propio asesor tocando un botón (se abre WhatsApp con el texto escrito). La huella/PIN los maneja el teléfono: la app no recibe ni guarda datos biométricos. Soporte puede abrir una cartera para ayudar y **queda registrado** (`admin_log`).

### Preguntas generales
| Pregunta de Play Console | Respuesta |
|---|---|
| ¿Tu app recopila o comparte alguno de los tipos de datos requeridos? | **Sí** |
| ¿Todos los datos del usuario se cifran en tránsito? | **Sí** (HTTPS/TLS de Firebase y de carteraasesor.com) |
| ¿Ofreces una forma de solicitar que se borren los datos? | **Sí**: dentro de la app (☰ → Mi cuenta → Eliminar mi cuenta) y por la web, ver abajo |
| URL para pedir la eliminación (la pide la política de eliminación de cuentas) | **https://carteraasesor.com/eliminar-cuenta.html** (debe estar publicada **antes** de llenar el formulario: paso V2) |
| ¿Permites borrar solo algunos datos sin borrar la cuenta? | **Sí**: el asesor puede eliminar clientes y vaciar la papelera desde la app |
| ¿Sigues la política de Familias? / revisión de seguridad independiente | **No** (la app es para adultos; no aplica) |

### Tipos de datos (marcar solo estos; todo lo demás, **no**)
En «¿Se recopila?» = **Sí** en todos los de abajo. «¿Se comparte?» = **No** en todos (Google/Firebase es proveedor de servicios; WhatsApp lo abre el propio usuario con su acción). Ninguno es «tratado de forma efímera».
| Categoría de Play → tipo | Qué es en la app | ¿Obligatorio u opcional? | Para qué |
|---|---|---|---|
| Información personal → **Nombre** | Nombre del asesor y de sus clientes | Obligatorio | Funciones de la app; administración de la cuenta |
| Información personal → **Dirección de correo** | Correo del asesor (inicio de sesión) | Obligatorio | Funciones de la app; administración de la cuenta |
| Información personal → **Número de teléfono** | Celular del asesor y de sus clientes | Obligatorio | Funciones de la app; administración de la cuenta |
| Información personal → **ID de usuario** | Identificador de la cuenta (UID de Firebase) | Obligatorio | Funciones de la app; administración de la cuenta |
| Información personal → **Otra información** | CURP y NSS de los clientes (si el asesor los anota); país; notas y campos personalizados | Opcional | Funciones de la app |
| Información y actividad financiera → **Otra información financiera** | Montos, fechas e historial de pagos, comisiones | Opcional | Funciones de la app |
| Mensajes → **Otros mensajes dentro de la app** | Conversaciones con soporte | Opcional | Funciones de la app |
| Rendimiento y diagnóstico → **Diagnóstico** | Versión, tipo de navegador/pantalla y último error cuando el asesor manda un mensaje a soporte | Opcional | Funciones de la app |
| Dispositivo u otros ID → **Dispositivo u otros ID** | Identificador de aviso (token de Firebase Cloud Messaging) y tipo de teléfono, **solo si activa el aviso diario** | Opcional | Funciones de la app |

**No se recopila:** ubicación, contactos del teléfono, fotos, archivos (el Excel se lee **en el teléfono**; no se sube el archivo), audio, calendario, historial web, salud, datos biométricos, identificador de publicidad. **No hay anuncios.**

Notas de honestidad (para no equivocarme ante Google):
- Los nombres exactos de categorías pueden verse un poco distintos en pantalla; si dudas, **marca el dato** (declarar de más es seguro; declarar de menos no).
- **Faltan dos cosas por arreglar para que esto sea 100 % verdad** (las paso a Emma/Fernanda, ver «Pendientes»): (1) al **eliminar la cuenta no se borra** `usuarios/{uid}/config/avisos` (ahí queda el token del aviso diario); (2) el aviso de privacidad no menciona ese token ni el tipo de teléfono, y nombra a «Jonathan Naveda» sin decir que opera como NeuroProyectos IA.

---

## 5. Contenido de la app: clasificación, categoría, privacidad, contacto y cuenta de prueba

| Dato | Qué poner |
|---|---|
| **Categoría** | **Empresa** (Business). Etiquetas (hasta 5): cobranza, clientes, asesor, agenda, WhatsApp (revisar las que ofrezca la lista) |
| **URL de la política de privacidad** | https://carteraasesor.com/app/privacidad.html |
| **Correo de contacto (público en la ficha)** | soporte@carteraasesor.com |
| **Sitio web** | https://carteraasesor.com |
| **Teléfono de contacto** | Opcional; dejar vacío |
| **Anuncios** | **No** contiene anuncios |
| **Público objetivo** | **Mayores de 18 años** (herramienta profesional; así no aplica la política de Familias) |
| **Clasificación de contenido** (cuestionario IARC en Play Console; correo de contacto: soporte@carteraasesor.com) | Categoría «Utilidad / productividad / comunicación u otra». Respuestas: violencia **no**, contenido sexual **no**, lenguaje fuerte **no**, drogas/alcohol/tabaco **no**, apuestas **no**, miedo **no**; contenido generado por usuarios visible para otros **no** (cada asesor ve solo lo suyo); comparte ubicación **no**; compras digitales **no**; acceso libre a internet **no**. Resultado esperable: apta para todos. Responder siempre con la verdad |
| **Funciones financieras** (declaración obligatoria) | **«Mi app no ofrece funciones financieras»**: no presta dinero, no procesa pagos, no vende seguros. Solo lleva el registro que anota el asesor. (Es mi lectura de las opciones; si Play pregunta algo más, responder con la verdad.) |
| **Aplicación de gobierno / salud / noticias / rastreo COVID / ID de publicidad** | **No** a todo |
| **Acceso a la app (credenciales para el revisor)** | Sí hay inicio de sesión: ver cuenta de prueba abajo |
| **Eliminación de cuenta** | Ruta en la app y URL web (ver sección 4) |

### Cuenta de prueba para el revisor (con datos inventados)
La app **no deja usar ni escribir** en la cartera hasta que el correo esté verificado (lo exigen las reglas de seguridad), así que el correo debe **existir y recibir correo**. Por eso el paso V3 (alias `revisor@carteraasesor.com`).
1. **Crear la cuenta** en https://carteraasesor.com/app/ → «Crear cuenta»:
   - Nombre: `Revisor Google Play` · País: México · Celular: `+52 55 0000 0000` (inventado) · Correo: `revisor@carteraasesor.com`.
   - **Contraseña:** una nueva y larga que Jonathan inventa y guarda **solo** en su gestor de contraseñas. No se escribe en el repositorio, en este archivo ni en el chat.
2. **Verificar el correo:** llega a su Gmail por el reenvío; tocar el enlace.
3. **Cargar los 12 clientes inventados:** en la PC, ☰ → Importar y exportar → **Importar Excel** → archivo `tienda/cuenta-prueba/clientes-demo.xlsx` (12 clientes `Cliente Demo Uno…Doce`, celulares `55 0000 XXXX`, sin CURP ni NSS; con fechas que dan al día, por vencer y morosos). Si pasaron semanas, Emma lo regenera con `node tools/clientes-demo-revisor.mjs`. **No usar .csv**: la app lee mal las fechas de un .csv (ver «Pendientes»).
4. **No activar** PIN, huella ni aviso diario en esa cuenta (el revisor no debe encontrarse un bloqueo).
5. **En Play Console → Contenido de la app → Acceso a la app → Agregar instrucciones**, pegar el correo y la contraseña en sus casillas y este texto en «Otras instrucciones»:
   > The app requires sign-in (email + password). Use the test account provided; it is already verified and has 12 sample clients with fictional data, so every screen can be reviewed. No two-step verification or other steps are needed. Main flows: client list with Up to date / Due soon / Overdue status, client detail, register a payment, payment receipt via WhatsApp, Import Excel (☰ → Import and export), and Delete account (☰ → My account). The in-app menu is in Spanish.
6. **Antes de enviar a producción (D6):** entrar con esa cuenta y comprobar que sigue funcionando (y que el plan sigue siendo beta/sin límite). Si todos los clientes salen morosos por el tiempo, no pasa nada, pero se puede regenerar el Excel.

---

## 6. Materiales gráficos (revisados hoy)

| Qué | Archivo | Medida que pide Google | Estado |
|---|---|---|---|
| Ícono de la app | `tienda/icono-play-512.png` | 512×512, PNG 32 bits con transparencia, máx. 1024 KB | ✅ 321 KB |
| Gráfico de funciones | `tienda/grafico-funciones.png` | 1024×500, JPG o PNG 24 bits **sin transparencia** | ✅ |
| Capturas de teléfono (mín. 2, máx. 8) | `tienda/capturas/1…6.png` | de 320 a 3840 px por lado, JPG o PNG 24 bits **sin transparencia**; 9:16 y mínimo 1080×1920 para ser elegible a destacados | ✅ 1080×1920, 24 bits |

Capturas, en este orden (título de cada una, ya con los textos corregidos):
1. `1-inicio.png`: «Sabe al instante quién te debe».
2. `2-cliente.png`: «Todo de cada cliente a un toque».
3. `3-pago.png`: «La próxima fecha se calcula sola».
4. `4-comprobante.png`: «Comprobante de pago por WhatsApp».
5. `5-excel.png`: «Sube tu Excel tal como lo tienes».
6. `6-pin.png`: «Protegida con PIN y huella» · «Pídele PIN o huella a quien tome tu teléfono». (Revisada hoy: ya dice el texto nuevo de Julieta; no hizo falta regenerarla.)

Todas con **clientes inventados** (versión de Play, sin precios). Para rehacerlas después de cambiar la app: `node serve.js` y luego `node tools/capturas-play.mjs` (Edge automático y el marco `tienda/marco.html`).
Gráfico: `MSYS_NO_PATHCONV=1 node tools/foto-html.mjs /tienda/grafico.html tienda/grafico-funciones.png 1024 500` (usa la captura limpia `tienda/capturas/crudas/1-inicio.png`).
Nota de diseño (opcional, no urgente): el marco de las capturas (`tienda/marco.html`) usa la letra del sistema, no Bricolage Grotesque de la marca. Está aprobado y se ve bien; si Jonathan quiere unificarlo, es un cambio pequeño para Frida/Lucía.

---

## 7. Textos de la ficha (copiar tal cual; Julieta)

Límites de Google Play (ayuda oficial): **título 30**, **descripción breve 80**, **descripción completa 4000**.

**Nombre de la app** — 14 de 30 caracteres:
Cartera Asesor

(La política de metadatos prohíbe emojis en el título y en el nombre del desarrollador, y frases tipo «#1» o «la mejor». No se usa «IMSS» en el título para no insinuar relación con la institución; sí aparece en la descripción con su aviso aclaratorio.)

**Descripción breve** — 78 de 80 caracteres:
Organiza tu cartera de clientes, cobra a tiempo y recuerda pagos por WhatsApp.

**Descripción completa** — 1170 de 4000 caracteres (1175 si Google cuenta cada emoji como dos):

Cartera Asesor es la app para asesores de seguros y semanas IMSS que manejan decenas o cientos de clientes desde el celular. Deja el Excel y las libretas: sabe al instante quién está al día, quién está por vencer y quién te debe.

🚦 Estados automáticos
Cada cliente aparece al día, por vencer, moroso o de baja según su fecha de pago. Sin revisar a mano.

💬 Recordatorios por WhatsApp
Un toque abre WhatsApp con el mensaje de cobro ya escrito para ese cliente.

📥 Importa tu Excel
Carga tu lista actual en minutos. Revisamos CURP, NSS y duplicados por ti.

💵 Pagos e historial
Registra cada pago y la próxima fecha se calcula sola: mensual, trimestral, semestral, anual o cada cierto número de días.

☁️ En la nube y sin internet
Tus clientes quedan guardados en tu cuenta. Si pierdes el teléfono, entras desde otro y ahí están. También funciona sin conexión.

🔒 Tu propia cuenta
Nadie más entra a tu cartera, y si soporte te ayuda, cada acceso queda registrado. Tus datos viajan protegidos y se guardan en la nube de Google. Exporta todo a Excel cuando quieras.

Cartera Asesor es una herramienta de organización. No es una aseguradora ni realiza trámites ante el IMSS.

Observaciones de Andrea sobre el texto (para Julieta; **no los cambié**):
- Las dos primeras ideas son ciertas y aprobadas. El texto dice «Revisamos CURP, NSS y duplicados»: la app avisa de datos incompletos y duplicados, pero **no verifica ante el IMSS** si un NSS existe; el aviso final lo deja claro.
- Los 6 emojis de encabezado no están prohibidos en la descripción (solo en título, ícono y nombre del desarrollador), pero si Google se queja de «uso excesivo», se quitan sin perder nada.
- Si más adelante se anuncia el aviso diario, agregarlo a la descripción y volver a revisar la «Seguridad de los datos».

---

## 8. Datos para crear la cuenta de desarrollador (sábado, S2)
Detalle y archivos del perfil: `empresa/puente-digital/google-play/LEEME.md`.
| Campo | Qué poner |
|---|---|
| Tipo de cuenta | Personal |
| **Nombre del desarrollador** (lo ven los usuarios; se puede cambiar cuando quieras) | **NeuroProyectos IA** |
| Nombre legal y dirección | Los de tu identificación, **idénticos** a tu perfil de pagos de Google |
| Correo de contacto (Google lo usa para hablar contigo; no se muestra) y **correo del desarrollador** (sí se muestra en la ficha) | soporte@carteraasesor.com para el público (el dominio de NeuroProyectos IA está en pausa hasta pagar Play, se cambia después) |
| Teléfono | La línea nueva de la marca (Google la verifica con un código; no se muestra) |
| Sitio web | https://carteraasesor.com (opcional para cuentas personales) |

**Qué verá el público (según dos páginas de ayuda de Google que no coinciden del todo; lo confirmará la pantalla de registro):** el nombre de desarrollador, **tu nombre legal y tu país**, y el correo del desarrollador. La dirección completa se muestra **si cobras dentro de Google Play** (hoy la app es gratis y no cobra en Play). **Tu nombre legal puede verse aunque el nombre visible sea NeuroProyectos IA.** Si eso a Jonathan no le gusta, la alternativa es una cuenta de **organización**, que pide número D-U-N-S (gratis, lo tramita Dun & Bradstreet), y no tiene la regla de los 12 testers; es otra decisión y retrasaría el arranque. No encontré en la ayuda si una cuenta personal se puede convertir después; asumir que no.

---

## 9. Después de publicar
- Perfil del desarrollador (ícono, encabezado, texto): `empresa/puente-digital/google-play/LEEME.md`. Solo se puede crear con al menos una app publicada.
- Mantener «Seguridad de los datos» y la política de privacidad al día cuando cambien las funciones (por ejemplo, cuando haya pagos dentro de la app: Google exige su sistema de facturación).
- Cada mejora de la web llega sola a la app. Solo se sube un .aab nuevo si cambia algo del paquete (nombre, íconos, nivel de Android).
- **Nivel de Android:** Google sube el requisito (API) una vez al año; hay que re-empaquetar y subir una versión nueva antes de cada fecha límite o la app dejará de mostrarse a usuarios nuevos en Android recientes.

---

## 10. Pendientes para Emma / otras compañeras (los vio Andrea al preparar esto)
1. **Posible error de la app con archivos .csv (Tere/Emma):** al importar un `.csv`, las fechas se leen mal. Con fechas `2026-09-23` salen **un día antes** (en horario de México/Colombia/Venezuela) y con `05/11/2026` el día y el mes se **voltean** (sale 11 de mayo). Con `.xlsx` sale bien. Lo probé con el mismo código de la app (`plataforma/js/excel.js`). La guía de importación dice que se aceptan `.csv`; conviene corregirlo o avisarlo.
2. **Eliminar cuenta deja un resto (Fernanda/Emma):** `eliminarCuenta` en `plataforma/js/nube.js` solo borra clientes, papelera, historial, `config/main`, el perfil y el usuario. **No borra `usuarios/{uid}/config/avisos`**, donde queda el token del aviso diario. Google pide que la eliminación sea real. Arreglo pequeño: borrar ese documento antes del usuario.
3. **Aviso de privacidad (Fernanda/Julieta):** nombra al responsable como «Jonathan Naveda, persona natural con domicilio en Colombia». En Google Play el desarrollador es NeuroProyectos IA. Agregar «que opera bajo el nombre NeuroProyectos IA», mencionar el token del aviso diario y el tipo de teléfono, y revisar que la ruta de eliminar cuenta que dice el aviso coincida (☰ → Mi cuenta → Eliminar mi cuenta). Hoy el aviso dice «☰ Datos → Mi cuenta → …».
4. **Página nueva `sitio/eliminar-cuenta.html` (Julieta/Fernanda):** la escribí yo para cumplir la política de eliminación de cuentas; ofrece borrar desde la app o por correo y dice «te confirmamos por correo cuando esté hecho» (sin prometer plazo). Que Julieta la revise, y que Jonathan confirme que puede cumplir esa respuesta.
5. **`.gitignore`:** agregué `signing-key-info*`, `*.aab`, `*.apk` (llaves y paquetes) y **una única excepción** `!tienda/cuenta-prueba/clientes-demo.xlsx` para el Excel de clientes **inventados**. Fernanda: si la excepción no te parece bien, se quita y el archivo se genera con un comando cada vez.
6. **Si PWABuilder deja el paquete en API 35** (sección 2): hace falta el plan B el viernes.

---

## Fuentes (todas consultadas el 08/10/2026; los menús de Play Console pueden cambiar de nombre)
- Requisitos de prueba para cuentas personales nuevas (12 testers, 14 días seguidos, producción en ~7 días): https://support.google.com/googleplay/android-developer/answer/14151465
- Verificación de dispositivo Android (Android 10+, app Play Console): https://support.google.com/googleplay/android-developer/answer/14316361
- Verificar identidad (documento oficial, perfil de pagos, orden de verificaciones): https://support.google.com/googleplay/android-developer/answer/10841920
- Información requerida y qué es público: https://support.google.com/googleplay/android-developer/answer/13628312 y https://support.google.com/googleplay/android-developer/answer/10840893
- Empezar con Play Console (US$25, tipos de cuenta, tarjetas): https://support.google.com/googleplay/android-developer/answer/6112435
- Formulario Seguridad de los datos: https://support.google.com/googleplay/android-developer/answer/10787469
- Eliminación de cuentas (ruta en la app + enlace web): https://support.google.com/googleplay/android-developer/answer/13327111
- Nivel de API requerido (API 36 desde 31/08/2026): https://support.google.com/googleplay/android-developer/answer/11926878 · aviso de PWABuilder: https://github.com/pwa-builder/pwabuilder/issues/6160
- Activos gráficos (medidas): https://support.google.com/googleplay/android-developer/answer/9866151
- Clasificación de contenido: https://support.google.com/googleplay/android-developer/answer/9898843
- Declaración de funciones financieras: https://support.google.com/googleplay/android-developer/answer/13849271
- Instrucciones de acceso para el revisor: https://support.google.com/googleplay/android-developer/answer/9859455
- Política de metadatos: https://support.google.com/googleplay/android-developer/answer/9898842 · Funcionalidad y webview: https://support.google.com/googleplay/android-developer/answer/9899034
- assetlinks.json: https://developer.android.com/training/app-links/verify-android-applinks · TWA: https://developer.chrome.com/docs/android/trusted-web-activity/quick-start · pasos de PWABuilder: https://github.com/pwa-builder/CloudAPK/blob/master/Next-steps.md
- Archivos ocultos en GitHub Pages: https://github.com/actions/upload-pages-artifact/releases

**Lo que NO pude verificar (dicho con honestidad):** cuánto tarda Google en verificar la identidad y en revisar la primera versión; los nombres exactos de las casillas de PWABuilder (su documentación no cargó); los nombres exactos de las preguntas del cuestionario de clasificación; y si hoy PWABuilder ya empaqueta con API 36.
