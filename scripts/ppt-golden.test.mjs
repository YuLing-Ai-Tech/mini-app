import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { baselineDirectory, browserArguments, fontInventoryFingerprint, loadBaselineManifest, platformKey, requireEnvironment, verifyBaselineImages } from './ppt-golden-lib.mjs';

function temporary(callback) {
  const directory = mkdtempSync(path.join(tmpdir(), 'yuling-visual-test-'));
  try { callback(directory); } finally {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir()));
    assert.ok(path.basename(directory).startsWith('yuling-visual-test-'));
    rmSync(directory, { recursive: true, force: true });
  }
}

test('visual platform selection never falls back to another target', () => {
  assert.equal(platformKey('win32', 'x64'), 'win32-x64');
  assert.equal(platformKey('linux', 'x64'), 'linux-x64');
  assert.equal(baselineDirectory('root', 'win32', 'x64'), path.join('root', 'platforms', 'win32-x64'));
  for (const [system, arch] of [['darwin', 'x64'], ['linux', 'arm64'], ['win32', 'ia32']]) {
    assert.throws(() => platformKey(system, arch), /Unsupported visual platform/);
  }
});

test('Windows software rendering does not change Linux capture arguments', () => {
  assert.deepEqual(browserArguments('linux'), ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none']);
  assert.deepEqual(browserArguments('win32'), [...browserArguments('linux'), '--disable-gpu']);
});

test('missing platform manifest is not replaced by the historical manifest', () => temporary(directory => {
  writeFileSync(path.join(directory, 'manifest.json'), '{}');
  assert.throws(() => loadBaselineManifest(baselineDirectory(directory, 'win32', 'x64')), /manifest missing/);
}));

test('browser, fonts, viewport and argument drift fail explicitly', () => {
  for (const key of ['platform', 'architecture', 'chromeVersion', 'playwrightVersion', 'browserSha256', 'fontInventorySha256', 'browserArgs', 'viewport']) {
    assert.throws(() => requireEnvironment({ [key]: 'wrong' }, { [key]: 'actual' }), /environment mismatch/);
    assert.throws(() => requireEnvironment({}, { [key]: 'actual' }), /environment mismatch/);
  }
  assert.throws(() => requireEnvironment(undefined, {}), /environment missing/);
  requireEnvironment({ viewport: { width: 1920, height: 1080 } }, { viewport: { height: 1080, width: 1920 } });
});

test('missing or corrupted approved images fail integrity checks', () => temporary(directory => {
  const pages = [{ file: 'page-01.png', sha256: createHash('sha256').update('approved').digest('hex') }];
  assert.throws(() => verifyBaselineImages(directory, pages), /integrity failed/);
  writeFileSync(path.join(directory, 'page-01.png'), 'approved');
  verifyBaselineImages(directory, pages);
  writeFileSync(path.join(directory, 'page-01.png'), 'corrupt');
  assert.throws(() => verifyBaselineImages(directory, pages), /integrity failed/);
  assert.throws(() => verifyBaselineImages(directory, []), /page list missing/);
  assert.throws(() => verifyBaselineImages(directory, [{ file: '../outside.png' }]), /Invalid Golden/);
}));

test('font inventory changes are detected and Linux nested fonts are included', () => temporary(directory => {
  writeFileSync(path.join(directory, 'one.ttf'), 'font');
  const windows = fontInventoryFingerprint(directory, 'win32');
  const linux = fontInventoryFingerprint(directory, 'linux');
  assert.equal(windows, linux);
  mkdirSync(path.join(directory, 'nested'));
  writeFileSync(path.join(directory, 'nested', 'two.otf'), 'other font');
  assert.equal(fontInventoryFingerprint(directory, 'win32'), windows);
  assert.notEqual(fontInventoryFingerprint(directory, 'linux'), linux);
  writeFileSync(path.join(directory, 'one.ttf'), 'changed font');
  assert.notEqual(fontInventoryFingerprint(directory, 'win32'), windows);
}));
