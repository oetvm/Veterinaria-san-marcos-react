# 🐾 Veterinaria San Marcos — Frontend React

Aplicación web frontend desarrollada en **React 19** y **Vite 8** para **Veterinaria San Marcos**, conectada mediante **Axios** a la API RESTful de Spring Boot (`http://localhost:8080`) y persistida en **MySQL**. Permite navegar por el catálogo de productos, gestionar el carrito, administrar mascotas y citas médicas, y controlar el acceso según sesión y rol.

---

## 🛠️ Stack Tecnológico

- **Librería UI:** React `19.2.8` + React DOM `19.2.8`
- **Build / Servidor de desarrollo:** Vite `8.3.0` (`npm run dev`, `npm run build`, `npm run preview`)
- **Enrutamiento:** React Router DOM `7.18.7`
- **Cliente HTTP:** Axios `1.21.1` (conectado al backend en `http://localhost:8080`)
- **Testing y calidad:** Vitest `5.0.5`, `@testing-library/react` `16.3.3`, `@testing-library/jest-dom` `7.0.1` y ESLint `10.10.0`
- **Interfaz y estilos:** Navegación principal (**Inicio**, **Productos**, **Carrito**, **Iniciar Sesión**, **Registrarse**), selector de modo **Claro / Oscuro** y estilos en `App.css` / `index.css`

---

## 📂 Estructura del Proyecto

```text
Veterinaria-san-marcos-react/
├── public/
│   ├── img/               # Imágenes de productos y recursos públicos
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/            # Recursos estáticos del proyecto
│   ├── components/
│   │   ├── atoms/         # Componentes base
│   │   ├── molecules/     # Componentes compuestos
│   │   ├── organisms/     # Bloques complejos de interfaz
│   │   ├── CitaForm.jsx
│   │   ├── CitaList.jsx
│   │   ├── MascotaForm.jsx
│   │   └── MascotaList.jsx
│   ├── services/          # Servicios HTTP con Axios hacia http://localhost:8080
│   ├── views/             # Vistas principales de la aplicación
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   └── setupTest.js
├── plan_de_pruebas.md
├── package.json
└── vite.config.js
```
## ✨ Funcionalidades y Navegación
Navegación y tema: acceso a Inicio, Productos, Carrito, Iniciar Sesión y Registrarse, junto con alternancia entre modo claro y Oscuro.

Operaciones CRUD conectadas a MySQL: gestión de productos, carrito/pedidos, mascotas y citas a través de los servicios con Axios y el backend en el puerto 8080.

Sesión y roles: control de acceso y acciones según usuario autenticado y rol (admin / cliente).

Validaciones en formularios: validación de nombres y razas (solo letras y espacios), años de 4 dígitos, bloqueo de fechas/horas pasadas al agendar citas y límites de edad según especie (Exótico hasta 80 años; otras especies hasta 25 años).

## 🚀 Ejecución Local (VS Code)
- Verifica que MySQL y el Backend (Spring Boot) estén corriendo en http://localhost:8080.
- Abre la carpeta Veterinaria-san-marcos-react en VS Code y abre la terminal integrada.
- Instala las dependencias:
  npm install
  
- Inicia el servidor de desarrollo:
  npm run dev
  
- Abre la URL local indicada por Vite en el navegador.
- Para ejecutar pruebas unitarias con Vitest:
  npm test

## 🔐 Cuentas de Prueba (Datos Iniciales)
- Administrador (admin): admin@veterinaria.cl / admin123
- Cliente (cliente): juan@duocuc.cl / 123456
