// Warns when npm is running under an app-bundled Node (e.g. Codex.app),
// which shadows Homebrew Node on PATH and breaks native-module fallbacks.
const suspicious = /\.app\/Contents/.test(process.execPath)
if (suspicious) {
  console.warn(
    '\n⚠ timelog: npm is running under an app-bundled Node:\n' +
      `  ${process.execPath}\n` +
      '  Native module installs may fail. Re-run with Homebrew Node first on PATH:\n' +
      '  PATH="/opt/homebrew/bin:$PATH" npm install\n'
  )
}
