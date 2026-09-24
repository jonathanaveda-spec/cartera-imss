# Activar la nube (Firebase) — guía paso a paso

Objetivo: que Yamileth y tú vean **los mismos clientes** desde cualquier celular o PC, entrando con correo y contraseña.
Todo es gratis para este tamaño de datos (plan Spark). Necesitas una cuenta de Google.

## 1. Crear el proyecto
1. Entra a https://console.firebase.google.com con tu cuenta de Google.
2. **Crear un proyecto** → nombre: `cartera-imss` → desactiva Google Analytics → **Crear proyecto**.

## 2. Activar el inicio de sesión
1. Menú izquierdo: **Compilación (Build) → Authentication → Comenzar**.
2. Pestaña **Método de acceso** → **Correo electrónico/contraseña** → activa la primera opción → **Guardar**.
3. Pestaña **Configuración → Acciones del usuario** → desactiva **Habilitar creación (registro)** (así nadie más puede crear cuentas).
4. Pestaña **Configuración → Dominios autorizados** → **Agregar dominio**: `jonathanaveda-spec.github.io`.

## 3. Crear las 2 cuentas
1. Pestaña **Usuarios → Agregar usuario**.
2. Crea una para Yamileth y otra para ti (correo + una contraseña de al menos 8 caracteres; no uses la de tu correo).
3. Copia el **UID de usuario** de cada una (columna de la derecha, texto largo). Lo necesitas en el paso 5.

## 4. Crear la base de datos
1. **Compilación → Firestore Database → Crear base de datos**.
2. Ubicación: una de Estados Unidos (por ejemplo `nam5`). **No se puede cambiar después.**
3. Elige **Iniciar en modo de producción** → **Crear**.

## 5. Poner las reglas de seguridad (lo más importante)
1. En Firestore, pestaña **Reglas**.
2. Borra todo y pega el contenido de `firestore.rules` (está en esta carpeta).
3. Cambia `PEGA_AQUI_EL_UID_DE_YAMILETH` y `PEGA_AQUI_TU_UID` por los UID del paso 3 (deja las comillas).
4. **Publicar**.

Con esto, solo esas dos cuentas pueden leer o escribir; cualquier otra persona recibe "permiso denegado".

## 6. Darme la configuración de la app
1. Engrane ⚙️ junto a "Descripción general del proyecto" → **Configuración del proyecto**.
2. Baja a **Tus apps** → botón **</>** (Web) → apodo `cartera-imss` → **no marques Firebase Hosting** → **Registrar app**.
3. Aparece un bloque `const firebaseConfig = { apiKey: ..., authDomain: ..., projectId: ..., ... }`. **Cópialo y pégalo en el chat.**
   Estos valores no son secretos: lo que protege los datos son el inicio de sesión y las reglas del paso 5.

## 7. Después (lo hago yo)
- Pongo esa configuración en `app/js/nube-config.js` y lo publico.
- Abres la app en cualquier dispositivo → inicias sesión → si ese dispositivo ya tenía clientes y la nube está vacía, la app te pregunta si subirlos.
  Así se suben los 115 clientes de `Respaldo_inicial.json` (restáurelo una vez en un dispositivo, o pídele a Claude que lo suba).

## Cómo se comporta
- **Sin internet** la app sigue funcionando; los cambios se envían solos al volver la conexión.
- Los cambios de un dispositivo aparecen en el otro en segundos.
- Si dos personas editan **el mismo cliente al mismo tiempo**, gana el último guardado.
- **Cerrar sesión** (☰ Datos → Cuenta) borra los datos de ese dispositivo; siguen a salvo en la nube.
- Aun así, exporta a Excel de vez en cuando: protege contra borrados por error.
