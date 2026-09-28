# Crear el Firebase de la plataforma (paso 10 del plan)

Gratis (plan Spark). Unos 15 minutos. Necesitas una cuenta de Google.

## 1. Proyecto
1. https://console.firebase.google.com → **Crear un proyecto** → nombre provisional (ej. `cartera-asesor`) → sin Google Analytics → Crear.

## 2. Inicio de sesión
1. **Compilación → Authentication → Comenzar** → pestaña **Método de acceso** → **Correo electrónico/contraseña** → activar la primera opción → Guardar.
2. **Configuración → Dominios autorizados → Agregar dominio**: `jonathanaveda-spec.github.io`.
3. **Plantillas** (Templates) → cambia el idioma de las plantillas a **español**.
4. Deja activado el registro de usuarios (los asesores se registran solos).

## 3. Tu cuenta de administrador
1. **Users → Agregar usuario** → tu correo y una contraseña fuerte (no la de tu correo).
2. Copia tu **UID de usuario** (texto largo de la columna derecha).
   (El panel te reconoce por tu UID; no hace falta confirmar el correo de esta cuenta.)

## 4. Base de datos
1. **Compilación → Firestore Database → Crear base de datos** → ubicación en Estados Unidos (ej. `nam5`, no se puede cambiar) → **modo de producción**.
2. Pestaña **Reglas** → borra todo → pega el contenido de `plataforma/firestore.rules` → cambia `PEGA_AQUI_TU_UID` por tu UID → **Publicar**.

## 5. Configuración para la app
1. ⚙️ **Configuración del proyecto → Tus apps → `</>` (Web)** → apodo `plataforma` → sin Hosting → Registrar.
2. Copia el bloque `firebaseConfig = { ... }` y **pégalo en el chat**. No es secreto.
3. Pásame también tu **UID**.

Nunca me pases contraseñas.

## Después (lo hago yo)
- Pongo la configuración, publico la beta en `…/cartera-imss/beta/` y la pruebo con cuentas reales.
- Desde el panel (`…/beta/admin.html`) activas **Beta abierta** en «Sistema» para que todos entren sin límite.
