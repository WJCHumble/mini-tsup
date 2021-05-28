import { dirname, extname } from 'path'
import fs from 'fs'
import {
  build as esbuild,
  BuildResult,
  Plugin,
  formatMessages,
} from 'esbuild'
import { log } from './utils/log'
import { loadPkg, getDeps } from './utils/index'
import { NormalizeOptions, Format } from './types/options'
import { externalPlugin } from './esbuild/external'

export async function runEsbuild(options: NormalizeOptions, { format }: {format: Format}): Promise<BuildResult | undefined> {
  const pkg = await loadPkg(process.cwd())
  const deps = await getDeps(process.cwd())

  const external = [
    // Exclude dependencies, e.g. `lodash`, `lodash/get`
    ...deps.map(dep => new RegExp(`^${dep}($|\\/|\\\\)`)),
    ...(options.external || []),
  ]

  const outDir = options.outDir

  log(format, 'info', 'Build start')

  const startTime = Date.now()

  let result: BuildResult | undefined

  try {
    result = await esbuild({
      entryPoints: options.enteryPoints,
      format,
      bundle: true,
      platform: 'node',
      target: 'es2-16',
      plugins: [
        externalPlugin({
          patterns: external,
          skipNodeModulesBundle: options.skipNodeModulesBundle,
        }),
      ],
      outdir: outDir,
      write: false,
      logLevel: 'error',
    })
  } catch (error) {
    log(format, 'error', 'Build failed')
    throw error
  }

  // TODO: resolve result.warnings

  if (result && result.outputFiles) {
    const timeInMs = Date.now() - startTime
    log(format, 'success', `Build success in ${Math.floor(timeInMs)}ms`)

    const { transform } = await import('sucrase')
    await Promise.all(
      result.outputFiles.map(async(file) => {
        const dir = dirname(file.path)
        const outPath = file.path
        const ext = extname(outPath)
        await fs.promises.mkdir(dir, { recursive: true })
        let contents = file.text

        if (format === 'cjs') {
          contents = transform(contents, {
            filePath: file.path,
            transforms: ['imports'],
          }).code
        }

        await fs.promises.writeFile(outPath, contents, {
          encoding: 'utf-8',
        })
      }),
    )
  }

  return result
}
