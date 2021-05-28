import type { MarkRequired } from 'ts-essentials'

export type Format = 'cjs' | 'esm'

export interface Options {
  enteryPoints?: string[]
  watch?: boolean | string | (string | boolean) []
  dts?: boolean | string
  external?: (string | RegExp) []
  babel?: boolean
  format?: Format[]
  outDir?: string
  skipNodeModulesBundle?: boolean
}

export type NormalizeOptions = MarkRequired<
Options,
'enteryPoints' | 'format' | 'outDir'
>
