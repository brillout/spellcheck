import { shell } from '@brillout/shell'
import pc from '@brillout/picocolors'
import assert from 'node:assert'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const typosTomlFilePath = require.resolve('../typos.toml')

main()

async function main() {
  const { operation } = parseCliArgs()
  if (operation === 'fix') await fix()
  if (operation === 'check') await check()
}

async function fix() {
  if (await hasRepoChanges()) {
    console.log(pc.red(pc.bold('❌ Commit all changes before running this command.')))
    return
  }

  await runTypos('--write-changes')

  if (await hasRepoChanges()) {
    await shell('git add -A')
    await shell("git commit -m 'fix typos'")
    console.log(pc.green(pc.bold('✅ Typos fixed.')))
  } else {
    console.log(pc.green(pc.bold('✅ No typos found.')))
    console.log(pc.blue(pc.bold(`➡️  No changes.`)))
  }
}

async function check() {
  const res = await runTypos()
  const noTypos = res.stdout.trim().length === 0
  if (noTypos) {
    console.log(pc.green(pc.bold('✅ No typos found.')))
  } else {
    console.log(res.stdout)
    console.log(pc.red(pc.bold('❌ Typos found (see above).')))
    console.log(
      pc.blue(
        `➡️  Fix typos by running ${pc.bold('$ pnpm run spellcheck')}, or use ${pc.bold('spellcheck-ignore')} comments.`,
      ),
    )
    process.exit(1)
  }
}

async function hasRepoChanges() {
  const res = await shell('git status --porcelain')
  return res.stdout.trim().length > 0
}

/* Options:
```bash
pnpm dlx github:dalisoft/typos-rs-npm --help
```
*/
function runTypos(arg: '' | '--write-changes' = '') {
  assert(version)
  return shell(
    `pnpm dlx github:dalisoft/typos-rs-npm#v${version} --config ${typosTomlFilePath} --color always ${arg}`,
    { tolerateExitCode: true },
  )
}

var version: string | undefined
function parseCliArgs() {
  let operation: 'fix' | 'check' | undefined
  let stateIsVersion = false
  for (const arg of process.argv.slice(2)) {
    if (arg === 'fix' || arg === 'check') operation = arg
    else if (arg === '--version') stateIsVersion = true
    else if (stateIsVersion) version = arg
    else throw new Error(`Unknown argument ${pc.bold(arg)}`)
  }
  if (!operation) throw new Error(`Missing argument ${pc.bold('fix')} or ${pc.bold('check')}`)
  if (!version) throw new Error(`Missing argument ${pc.bold('--version')}`)
  if (!/^[0-9]/.test(version))
    throw new Error(`--version is set to ${pc.bold(version)} but it must start with a number`)
  return { operation, version }
}
