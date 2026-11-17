// Real end-to-end check: drive the actual `agy` CLI through the plugin's run layer.
import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { buildAntigravityArgs, resolveConfig } from '../lib/config.js'
import { resolveAgyCommand } from '../lib/resolve.js'
import { startAntigravityRun } from '../lib/run.js'

/** Node child_process adapted to the seam's subprocess handle. */
function nodeSpawn(spec) {
    const child = spawn(spec.argv[0], spec.argv.slice(1), {
        cwd: spec.cwd,
        env: { ...process.env, ...spec.env },
        stdio: ['pipe', 'pipe', 'pipe'],
    })
    let exited = false
    const done = new Promise(resolve => {
        child.on('close', (code, signal) => {
            exited = true
            resolve({ exitCode: code, signal })
        })
    })
    return {
        stdin: child.stdin,
        stdout: child.stdout,
        stderr: child.stderr,
        done,
        async waitForExit(signal) {
            if (exited) return true
            return await new Promise(resolve => {
                child.once('close', () => resolve(true))
                if (signal !== undefined) signal.addEventListener('abort', () => resolve(false), { once: true })
            })
        },
        terminate() {
            if (!exited) child.kill('SIGTERM')
        },
    }
}

const resolution = resolveAgyCommand({})
console.log('resolved CLI:', JSON.stringify(resolution))
if (!resolution.ok) process.exit(1)

const config = resolveConfig({ model: process.argv[2] ?? 'gemini-4-hydrogen-low', effort: 'low' })
const cwd = mkdtempSync(join(tmpdir(), 'agy-real-'))
const prompt = 'Reply with exactly: SUBAGENT PONG'
console.log('argv:', JSON.stringify(buildAntigravityArgs(config, prompt)))

const started = Date.now()
const run = startAntigravityRun(
    { cwd, prompt: [{ type: 'text', text: prompt }], signal: new AbortController().signal },
    {
        command: resolution.command,
        args: buildAntigravityArgs(config, prompt),
        cwd,
        env: config.env,
        graceMs: config.disposeGraceMs,
        timeoutMs: 180_000,
        spawn: nodeSpawn,
        onError: (error, reason) => console.log('onError:', reason, error.message),
    },
)

const result = await run.result
await run.dispose()
console.log(`elapsed: ${((Date.now() - started) / 1000).toFixed(1)}s`)
console.log('run.id:', run.id)
console.log('result:', JSON.stringify(result, null, 2))
