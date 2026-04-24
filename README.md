# Gestor de Gastos del Hogar

Aplicación web full-stack para gestionar los gastos del hogar: hipoteca, suministros, seguros, comunidad y más. Permite subir facturas en PDF y extrae automáticamente los datos (fecha, importe, categoría) sin ninguna API externa.

## Características

- **Autenticación** — registro e inicio de sesión con JWT; cada usuario tiene sus propios datos aislados
- **Gastos** — crear, editar, eliminar y mover gastos entre meses/años
- **Categorías** — categorías personalizables con nombre, color e icono
- **Facturas** — adjuntar facturas PDF o imagen a cada gasto; descarga directa
- **Análisis automático de facturas** — al subir un PDF extrae fecha, importe, nombre y categoría mediante PDFBox + regex (sin coste, sin APIs externas)
- **Estadísticas** — resumen anual con totales por mes y por categoría
- **Responsive** — diseño adaptado a móvil con barra de navegación inferior y soporte para safe-area (iPhone notch)
- **Multi-año** — navegación por años con selector dinámico

## Stack tecnológico

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Java | 21 | Lenguaje |
| Spring Boot | 3.2.3 | Framework principal |
| Spring Security | 6 | Autenticación / autorización |
| JJWT | 0.12.3 | Tokens JWT |
| Spring Data JPA / Hibernate | — | ORM |
| PostgreSQL | 16 | Base de datos |
| Apache PDFBox | 2.0.30 | Extracción de texto de PDF |
| Lombok | 1.18.34 | Reducción de boilerplate |
| Maven | 3.9 | Build |

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 14 | Framework React (App Router) |
| React | 18 | UI |
| TypeScript | 5 | Tipado |
| Tailwind CSS | 3.4 | Estilos |
| SWR | 2.2 | Fetching y caché |
| react-hot-toast | 2.4 | Notificaciones |
| lucide-react | 0.378 | Iconos |

## Arquitectura

```
gastos/
├── backend/                  # Spring Boot API REST
│   └── src/main/java/com/gastos/
│       ├── config/           # SecurityConfig, CORS, excepciones globales
│       ├── controller/       # AuthController, ExpenseController, CategoryController, InvoiceController
│       ├── dto/              # Request/Response DTOs
│       ├── entity/           # User, Expense, Category, Invoice
│       ├── repository/       # JPA Repositories
│       ├── security/         # JwtAuthFilter, JwtUtil
│       └── service/          # Lógica de negocio + InvoiceAnalysisService
├── frontend/                 # Next.js 14 App Router
│   ├── app/                  # Páginas (layout, page)
│   ├── components/           # Componentes React
│   └── lib/                  # api.ts, auth.ts, types.ts
├── Dockerfile                # Build multi-stage (Maven → JRE Alpine)
├── docker-compose.yml        # PostgreSQL local
└── railway.json              # Configuración despliegue Railway
```

## Puesta en marcha local

### Requisitos
- Java 21
- Maven 3.9+
- Node.js 20+
- Docker (para la base de datos)

### 1. Base de datos

```bash
docker-compose up -d
```

Levanta PostgreSQL 16 en `localhost:5432` con base de datos `gastos`.

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

El servidor arranca en `http://localhost:8080`.

Variables de entorno opcionales (con valores por defecto para desarrollo):

| Variable | Por defecto |
|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/gastos` |
| `SPRING_DATASOURCE_USERNAME` | `gastos_user` |
| `SPRING_DATASOURCE_PASSWORD` | `gastos_pass` |
| `JWT_SECRET` | clave de desarrollo incluida |
| `UPLOADS_DIR` | `uploads` |
| `APP_BASE_URL` | `http://localhost:8080` |
| `ALLOWED_ORIGINS` | `http://localhost:3000` |

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

Crear el archivo `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Despliegue en producción

El proyecto está configurado para desplegar con **Railway** (backend + PostgreSQL) y **Vercel** (frontend).

### Backend — Railway

1. Crear un nuevo proyecto en [Railway](https://railway.app)
2. Añadir un servicio PostgreSQL
3. Conectar el repositorio GitHub (Railway detecta el `Dockerfile` automáticamente gracias a `railway.json`)
4. Configurar las variables de entorno:

| Variable | Valor |
|---|---|
| `SPRING_DATASOURCE_URL` | URL de la base de datos PostgreSQL de Railway |
| `SPRING_DATASOURCE_USERNAME` | Usuario de Railway |
| `SPRING_DATASOURCE_PASSWORD` | Contraseña de Railway |
| `JWT_SECRET` | Cadena aleatoria larga y segura |
| `APP_BASE_URL` | URL pública del backend en Railway |
| `ALLOWED_ORIGINS` | URL pública del frontend en Vercel |

### Frontend — Vercel

1. Importar el repositorio en [Vercel](https://vercel.com)
2. Establecer el directorio raíz como `frontend`
3. Añadir la variable de entorno:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://tu-backend.up.railway.app/api` |

## API REST

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login, devuelve JWT |
| GET | `/api/auth/me` | Datos del usuario autenticado |
| GET | `/api/expenses` | Listar gastos (filtros: year, month, categoryId) |
| POST | `/api/expenses` | Crear gasto |
| PUT | `/api/expenses/{id}` | Actualizar gasto |
| PATCH | `/api/expenses/{id}/move` | Mover a otro mes/año |
| DELETE | `/api/expenses/{id}` | Eliminar gasto |
| GET | `/api/expenses/years` | Años con gastos registrados |
| GET | `/api/expenses/stats?year=` | Estadísticas anuales |
| GET | `/api/categories` | Listar categorías |
| POST | `/api/categories` | Crear categoría |
| PUT | `/api/categories/{id}` | Actualizar categoría |
| DELETE | `/api/categories/{id}` | Eliminar categoría |
| POST | `/api/invoices/upload/{expenseId}` | Subir factura |
| POST | `/api/invoices/analyze` | Analizar PDF y extraer datos |
| GET | `/api/invoices/expense/{expenseId}` | Facturas de un gasto |
| DELETE | `/api/invoices/{id}` | Eliminar factura |
| GET | `/files/{filename}` | Descarga de archivo (público) |

## Análisis automático de facturas

Al subir un PDF en el formulario de nuevo gasto, el backend extrae automáticamente:

- **Nombre** — busca etiquetas como "Concepto:", "Descripción del servicio:" o toma la primera línea significativa del documento
- **Fecha** — prioriza campos etiquetados con "Fecha:", luego patrones DD/MM/YYYY y "15 de enero de 2025"
- **Importe** — busca cerca de "Total", "Total a pagar", "Importe total"; soporta separador de miles europeo (`1.234,56`)
- **Categoría** — coincidencia por palabras clave en español (Hipoteca, Suministros, Seguros, Comunidad, Reformas, Mantenimiento, Telecomunicaciones, Alquiler)

Todo el procesamiento ocurre en el servidor con **PDFBox**. No se usa ninguna API externa, no hay coste por uso y no hay límites de peticiones.

## Licencia

MIT
