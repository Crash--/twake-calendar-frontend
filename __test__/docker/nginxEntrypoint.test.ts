/// <reference types="node" />
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const ENTRYPOINT = path.resolve(
  import.meta.dirname,
  '../../nginx-entrypoint.sh'
)

// Runs the entrypoint against a temporary .env.js and conf, without nginx
const generateConf = (envJs: string): string => {
  const dir = mkdtempSync(path.join(tmpdir(), 'nginx-entrypoint-'))
  const script = readFileSync(ENTRYPOINT, 'utf8')
    .replace(/^ENV_JS=.*$/m, `ENV_JS=${dir}/.env.js`)
    .replace(/^CACHE_ENV_CONF=.*$/m, `CACHE_ENV_CONF=${dir}/cache_env.conf`)
    .replace(/^exec nginx.*$/m, 'true')
  writeFileSync(path.join(dir, '.env.js'), envJs)
  writeFileSync(path.join(dir, 'entrypoint.sh'), script)
  execFileSync('sh', [path.join(dir, 'entrypoint.sh')], { stdio: 'ignore' })
  return readFileSync(path.join(dir, 'cache_env.conf'), 'utf8')
}

describe('nginx-entrypoint.sh', () => {
  it('opts the HTML in to credentialed prerender when TWAKE_RAIL is true', () => {
    expect(generateConf('var TWAKE_RAIL = true\n')).toContain(
      'map $uri $supports_loading_mode { "~*\\.html$" "credentialed-prerender"; default ""; }'
    )
  })

  it.each([
    ['false', 'var TWAKE_RAIL = false\n'],
    ['unset', 'var DEBUG = false\n'],
    ['commented out', '// var TWAKE_RAIL = true\n']
  ])('sends no loading mode when TWAKE_RAIL is %s', (_, envJs) => {
    const conf = generateConf(envJs)

    expect(conf).toContain('map $uri $supports_loading_mode { default ""; }')
    expect(conf).not.toContain('credentialed-prerender')
  })

  it('serves the HTML with no-cache in production', () => {
    const conf = generateConf('var DEBUG = false\n')

    expect(conf).toContain('$html_cache_control { default "no-cache"; }')
  })
})
