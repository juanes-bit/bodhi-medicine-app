## Bodhi Medicine App
- Aplicación Expo/React Native para acceder a los cursos y flujos de Bodhi Medicine.  
- Código principal bajo `apps/mobile/` con Expo Router y EAS listo para builds nativos.

## Requisitos previos comunes
- **Node.js 18 LTS** (expo@54 requiere >= 18.0). Verifica con `node -v`.
- **npm 10+** (instalado con Node) o **Yarn 1.22** si prefieres.  
- **Git** para clonar y gestionar branches.
- **Cuenta Expo** (opcional) para usar EAS Build o Dev Client.
- **Acceso a staging de WordPress**: define la variable `EXPO_PUBLIC_WP_BASE` con la URL del backend correspondiente.

## Instalación en Windows
1. **Node.js**: descarga el instalador LTS desde [nodejs.org](https://nodejs.org) o usa [nvm-windows](https://github.com/coreybutler/nvm-windows) para gestionar versiones.
2. **Herramientas nativas**: instala [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (selecciona *Desktop development with C++*) si planeas compilar módulos nativos.
3. **Android Studio**:  
   - Instala [Android Studio](https://developer.android.com/studio) y durante el setup incluye Android SDK, Platform Tools y un emulador (API 34 recomendado).  
   - Configura las variables de entorno:  
     - `ANDROID_HOME=C:\Users\<usuario>\AppData\Local\Android\Sdk`  
     - Añade `%ANDROID_HOME%\platform-tools` y `%ANDROID_HOME%\emulator` al `PATH`.
4. **Expo CLI**: no es obligatorio instalarlo globalmente; puedes usar `npx expo`. Si prefieres, `npm install -g expo-cli`.
5. **Clonar e instalar dependencias**:
   ```bash
   git clone https://github.com/juanes-bit/bodhi-medicine-app.git
   cd bodhi-medicine-app
   npm install
   ```
6. **Variables de entorno**: coloca un archivo `apps/mobile/.env` con:
   ```bash
   EXPO_PUBLIC_WP_BASE=https://staging.bodhimedicine.com
   ```
   Cambia la URL si apuntas a otro entorno.
7. **Ejecutar en emulador Android**:
   ```bash
   npm run android
   ```
   Asegúrate de abrir el emulador desde Android Studio o usar un dispositivo físico con depuración USB habilitada.

## Instalación en macOS (Intel)
1. **Homebrew** (opcional pero recomendado):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. **Node.js y Watchman**:
   ```bash
   brew install node@18 watchman
   ```
3. **Xcode**:
   - Instala Xcode desde la App Store.  
   - Ejecuta `sudo xcodebuild -runFirstLaunch` y acepta las licencias.  
   - Instala Command Line Tools: `xcode-select --install` (si no se instalaron con Xcode).
4. **CocoaPods** (para iOS nativo):
   ```bash
   sudo gem install cocoapods
   ```
5. **Android Studio** (opcional si también compilarás Android) con los mismos pasos de SDK que en Windows.
6. **Clonar e instalar**:
   ```bash
   git clone https://github.com/juanes-bit/bodhi-medicine-app.git
   cd bodhi-medicine-app
   npm install
   ```
7. **Variables de entorno**: crea/edita `apps/mobile/.env` igual que en Windows.
8. **Ejecutar**:
   - iOS Simulator:
     ```bash
     npm run ios
     ```
   - Android:
     ```bash
     npm run android
     ```
   - Modo genérico (Metro bundler con QR):
     ```bash
     npm run start
     ```

## Instalación en macOS (Apple Silicon M1/M2)
- Sigue los pasos de macOS Intel con diferencias clave:
  1. **Instala Rosetta** para ejecutar binarios x86 cuando sea necesario:
     ```bash
     softwareupdate --install-rosetta --agree-to-license
     ```
  2. **Homebrew** se instala por defecto en `/opt/homebrew`. Usa:
     ```bash
     /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
     echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
     eval "$(/opt/homebrew/bin/brew shellenv)"
     brew install node@18 watchman
     ```
  3. **Pods para Apple Silicon**: en proyectos Expo no suele necesitarse, pero si corres `pod install` en carpetas nativas ejecuta:
     ```bash
     sudo gem install cocoapods
     sudo arch -arm64 gem pristine ffi -- --enable-libffi-alloc
     ```
- El resto de pasos (Xcode, Android Studio, copia de `.env`, comandos `npm run ios|android`) son los mismos.

## Scripts principales
- `npm run start`: levanta Metro bundler y Expo Dev Server.
- `npm run android`: compila y lanza la app en un emulador/dispositivo Android.
- `npm run ios`: abre la app en el simulador de iOS (requiere macOS).
- `npm run web`: vista previa web via Expo Router (modo experimental).
- `npm run lint`: ejecuta ESLint sobre el proyecto.

## Notas sobre autenticación y API
- La app consume servicios WordPress proxied; al iniciar sesión se guardan cookies y nonce en el dispositivo.  
- Para pruebas locales puedes iniciar sesión con credenciales de staging; si recibes `401` en Android, abre la pantalla de login y autentícate para refrescar la sesión.  
- Si necesitas apuntar a otra instancia, cambia `EXPO_PUBLIC_WP_BASE` y reinicia Metro (`Shift + r` en el terminal de Expo).

## Solución de problemas frecuentes
- **Metro no detecta el dispositivo**: asegúrate de que el emulador esté abierto y que `adb devices` lo liste.  
- **Error de permisos en Android (Windows)**: ejecuta PowerShell como administrador o habilita permisos de escritura en la ruta del SDK.  
- **Errores con pods en macOS**: elimina `ios/Pods` y ejecuta `npx expo prebuild --clean` seguido de `cd ios && pod install`.  
- **401 tras clonar**: la sesión no se comparte; inicia sesión desde la app para obtener cookies/nonce válidos.

## Flujo recomendado de desarrollo
- Crea una branch por feature: `git checkout -b feat/nueva-feature`.
- Usa `npm run lint` antes de comitear.
- Los cambios se suben usando `git push origin <branch>` y se integran a `main` con PR.
- Para builds internas o publicadas usa [EAS Build](https://docs.expo.dev/build/setup/) con el proyecto configurado (`apps/mobile/eas.json`).

