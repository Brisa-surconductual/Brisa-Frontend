# Frontend

Frontend desarrollado con **React** y **Vite**, siguiendo una arquitectura **SPA (Single Page Application)** organizada mediante **Feature-Based Architecture** y **Screaming Architecture**, preparada para evolucionar hacia una **Progressive Web App (PWA)** bajo un enfoque **Offline-First**.

---

# Tecnologías

| Tecnología | Versión |
|------------|---------|
| Node.js | 22 LTS o superior |
| npm | 10 o superior |
| React | 19.2.7 |
| Vite | 8.1.1 |
| JavaScript (ES2024) | Última versión estable |
| React Router | Última versión estable |

---

# Arquitectura

El proyecto implementa los siguientes enfoques arquitectónicos:

- SPA (Single Page Application)
- Feature-Based Architecture
- Screaming Architecture
- Component-Based Architecture
- Offline-First (PWA)

El objetivo es desarrollar una aplicación modular, reutilizable y escalable, donde la estructura del proyecto refleje el dominio del negocio y no la tecnología utilizada.

---

# Organización del proyecto

```text
src/

├── app/
├── features/
├── shared/
├── assets/
├── styles/
│
├── App.jsx
└── main.jsx
```

---

# App

Contiene la configuración principal de la aplicación.

Ejemplos:

```text
app/

├── router/
├── providers/
├── layouts/
├── store/
└── config/
```

Aquí se centralizan aspectos globales como:

- Configuración del Router
- Providers
- Layouts principales
- Estado global (si aplica)
- Configuración general de la aplicación

---

# Features

Contiene las funcionalidades del sistema.

Cada carpeta representa un módulo del negocio.

Ejemplo:

```text
features/

├── auth/
├── users/
├── inventory/
├── products/
└── orders/
```

Cada feature es independiente de las demás.

Esta organización facilita el mantenimiento y permite que el crecimiento del proyecto sea modular.

---

# Organización de una Feature

Cada funcionalidad mantiene sus propios componentes y lógica.

```text
users/

├── api/
├── components/
├── hooks/
├── pages/
├── services/
├── types/
├── utils/
└── index.js
```

---

## API

Contiene las funciones encargadas de comunicarse con el Backend.

Ejemplo:

```javascript
getUsers()

createUser()

updateUser()
```

---

## Components

Componentes exclusivos de esa funcionalidad.

Ejemplo:

```text
UserCard

UserTable

UserForm
```

Estos componentes no deberían utilizarse desde otras features.

---

## Hooks

Hooks personalizados relacionados únicamente con la funcionalidad.

Ejemplo:

```javascript
useUsers()

useCreateUser()
```

---

## Pages

Representan las vistas principales asociadas a esa funcionalidad.

Ejemplo:

```text
UsersPage

CreateUserPage

EditUserPage
```

---

## Services

Contiene lógica reutilizable relacionada con la feature.

Ejemplos:

- Transformación de datos
- Validaciones
- Cálculos
- Exportaciones
- Procesamiento de información

---

## Types

Define los tipos e interfaces utilizados dentro de la funcionalidad.

---

## Utils

Funciones auxiliares utilizadas únicamente dentro de la feature.

---

# Shared

Contiene recursos reutilizables por toda la aplicación.

Ejemplo:

```text
shared/

├── components/
├── hooks/
├── services/
├── utils/
├── constants/
└── types/
```

Aquí se encuentran elementos como:

- Botones
- Inputs
- Modales
- Navbar
- Sidebar
- Hooks compartidos
- Utilidades generales
- Tipos globales

---

# Assets

Contiene los recursos estáticos del proyecto.

Ejemplos:

- Imágenes
- Iconos
- Logos
- Tipografías

---

# Styles

Contiene los estilos globales de la aplicación.

Ejemplos:

- Variables CSS
- Temas
- Estilos globales

---

# Progressive Web App (PWA)

La aplicación está diseñada para evolucionar hacia una Progressive Web App.

Entre las características esperadas se encuentran:

- Instalación desde el navegador.
- Funcionamiento sin conexión.
- Caché inteligente de recursos.
- Sincronización cuando se recupere la conexión.
- Mejor experiencia en dispositivos móviles.

---

# Principios utilizados

- Component-Based Architecture
- Feature-Based Architecture
- Screaming Architecture
- Reutilización de componentes
- Separación de responsabilidades
- Bajo acoplamiento
- Alta cohesión

---

# Instalación

## Clonar el proyecto

```bash
git clone <url-del-repositorio>
```

---

## Instalar dependencias

```bash
pnpm install
```

---

## Ejecutar el proyecto

Modo desarrollo

```bash
pnpm dev
```

---

## Compilar para producción

```bash
pnpm build
```

---

## Vista previa de producción

```bash
pnpm preview
```

---

# Convenciones

- Cada feature representa una funcionalidad del negocio.
- Los componentes compartidos deben ubicarse en `shared`.
- Los componentes específicos deben permanecer dentro de su feature.
- La lógica de comunicación con el backend debe implementarse en la carpeta `api`.
- La estructura del proyecto debe reflejar el dominio del negocio y no la tecnología utilizada.

---

# Equipo de desarrollo

Proyecto desarrollado por el equipo de Ingeniería de Software.
