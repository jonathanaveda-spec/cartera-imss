# Ficha de Google Play — Cartera Asesor

Textos listos para copiar en Play Console → Presencia en la tienda → Ficha principal.

**Nombre de la app** (máx. 30): Cartera Asesor

**Descripción breve** (máx. 80):
Organiza tu cartera de clientes, cobra a tiempo y recuerda pagos por WhatsApp.

**Descripción completa** (máx. 4000):
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

🔒 Privada y segura
Cada asesor ve solo sus propios clientes. Exporta todo a Excel cuando quieras.

Cartera Asesor es una herramienta de organización. No es una aseguradora ni realiza trámites ante el IMSS.

**Categoría:** Empresa (Business)
**Correo de contacto:** soporte@carteraasesor.com
**Sitio web:** https://carteraasesor.com
**Política de privacidad:** https://carteraasesor.com/app/privacidad.html

## Imágenes
- Ícono 512×512: `plataforma/icons/icon-512.png`
- Gráfico de funciones 1024×500: `tienda/grafico-funciones.png`
- Capturas de teléfono: **listas**, 6 de 1080×1920 en `tienda/capturas/`. Se suben en este orden:
  1. `1-inicio.png`: «Sabe al instante quién te debe».
  2. `2-cliente.png`: «Todo de cada cliente a un toque».
  3. `3-pago.png`: «La próxima fecha se calcula sola».
  4. `4-comprobante.png`: «Comprobante de pago por WhatsApp».
  5. `5-excel.png`: «Sube tu Excel tal como lo tienes».
  6. `6-pin.png`: «Protegida con PIN y huella».
- Las capturas se hicieron con **clientes inventados** en la demo local y en la versión de Play (sin precios).
- Para rehacerlas después de cambiar la app:
  1. Correr `node serve.js`.
  2. Correr `node tools/capturas-play.mjs`. Usa Edge en modo automático y el marco de `tienda/marco.html`.

## Cuenta de prueba para el revisor de Google
Crear una cuenta de asesor de demostración con clientes inventados y dar correo/contraseña
en Play Console → Contenido de la app → Acceso a la app. (Pendiente.)
