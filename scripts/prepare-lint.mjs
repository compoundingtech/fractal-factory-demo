import { mkdir, writeFile } from 'node:fs/promises'

// The same four general TypeScript rules enabled by
// effect-utils, pinned to the formatting reference.
const revision = '81ce93345'
const rules = {
  'explicit-boolean-compare':
    'explicitBooleanCompareRule',
  'exports-first': 'exportsFirstRule',
  'jsdoc-require-exports': 'jsdocRequireExportsRule',
  'named-args': 'namedArgsRule',
}
const directory = new URL(
  '../.cache/effect-utils/',
  import.meta.url,
)
await mkdir(directory, { recursive: true })
await Promise.all(
  Object.keys(rules).map(async (name) => {
    const url = `https://raw.githubusercontent.com/overengineeringstudio/effect-utils/${revision}/packages/@overeng/oxc-config/src/${name}.ts`
    const response = await fetch(url)
    if (response.ok === false)
      throw new Error(
        `Cannot fetch lint rule ${name}: ${response.status}`,
      )
    await writeFile(
      new URL(`${name}.ts`, directory),
      await response.text(),
    )
  }),
)
await writeFile(
  new URL('plugin.ts', directory),
  [
    ...Object.entries(rules).map(
      ([name, symbol]) =>
        `import { ${symbol} } from './${name}.ts'`,
    ),
    'export default { meta: { name: "overeng" }, rules: {',
    ...Object.entries(rules).map(
      ([name, symbol]) => `  '${name}': ${symbol},`,
    ),
    '} }',
  ].join('\n'),
)
