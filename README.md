# gastromind-mobile
Este repositorio contiene la aplicación móvil de Gastromind. Diseñada para ser la extensión táctil del "Cerebro de la Cocina", esta app se centra en la entrada rápida de datos mediante cámara y la gestión proactiva de notificaciones inteligentes.

## Estructura de proyecto:

```
src/
├── core/                  # El corazón (Lógica y Reglas)
│   ├── domain/            # Interfaces de repositorios y Entidades
│   └── application/       # Casos de uso (LoginUser, GetRecipes)
│
├── adapters/              # Los puentes con el mundo
│   ├── ui/                # (Entrada) Lo que se ve
│   │   ├── components/    # <--- AQUÍ EXTRAEMOS LOS COMPONENTES
│   │   ├── screens/
│   │   └── navigation/
│   └── external/          # (Salida) Lo que se conecta (Antes Infra)
│       ├── api/           # Conexión Spring Boot
│       └── storage/       # Persistencia local
│
└── shared/                # Estilos, constantes, tipos globales
```