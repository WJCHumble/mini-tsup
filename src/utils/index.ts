import fs from 'fs'
import path from 'path'
import { transform } from 'sucrase'
import JoyCon from 'joycon'
import { requireFromString } from './require-from-string'

const joycon = new JoyCon()

joycon.addLoader({
  test: /\.ts$/,
  async load(filepath) {
    const content = await fs.promises.readFile(filepath, 'utf8')
    const { code } = transform(content, {
      filePath: filepath,
      transforms: ['imports', 'typescript'],
    })
    const mod = requireFromString(code, filepath)
    return mod.default || mod
  },
})

// TODO: 是否需要这个 loader
joycon.addLoader({
  test: /\.cjs$/,
  load(filepath) {
    delete require.cache[filepath]
    return require(filepath)
  },
})

export async function loadPkg(cwd: string) {
  const { data } = await joycon.load(['package.json'], cwd, path.dirname(cwd))
  return data || {}
}

export async function getDeps(cwd: string) {
  const data = await loadPkg(cwd)

  const deps = Array.from(
    new Set([
      ...Object.keys(data.dependencies || {}),
      ...Object.keys(data.peerDependencies || {}),
    ]),
  )

  return deps
}
