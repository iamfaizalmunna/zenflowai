import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  assertInsideUploadDir,
  attachmentStoragePath,
  decodeBase64File,
  maxUploadBytes,
  resolveUploadDir,
  safeUploadFilename,
} from './uploadPath';

describe('Phase 8 local upload paths', () => {
  it('strips directory traversal from filenames', () => {
    assert.equal(safeUploadFilename('../../etc/passwd'), 'passwd');
    assert.equal(safeUploadFilename('..\\secret.png'), 'secret.png');
    assert.ok(!safeUploadFilename('../x').includes('..'));
    assert.equal(safeUploadFilename('...'), 'file');
    assert.match(safeUploadFilename('weird#name!.png'), /weird_name_\.png|weird_name/);
  });

  it('nests files under the ticket id', () => {
    const stored = attachmentStoragePath(12, 'shot.png');
    assert.ok(stored.startsWith(`12${path.sep}`) || stored.startsWith('12/'));
    assert.match(stored, /shot\.png$/);
  });

  it('decodes raw and data-url base64', () => {
    const raw = Buffer.from('hello').toString('base64');
    assert.equal(decodeBase64File(raw).toString(), 'hello');
    assert.equal(decodeBase64File(`data:text/plain;base64,${raw}`).toString(), 'hello');
  });

  it('resolves upload dir, size cap, and path jail', () => {
    const prevMb = process.env.MAX_FILE_SIZE_MB;
    const prevDir = process.env.UPLOAD_DIR;
    process.env.MAX_FILE_SIZE_MB = '2';
    process.env.UPLOAD_DIR = '/tmp/zenflow-uploads';
    assert.equal(maxUploadBytes(), 2 * 1024 * 1024);
    const root = resolveUploadDir();
    assert.equal(root, path.resolve('/tmp/zenflow-uploads'));
    assert.doesNotThrow(() => assertInsideUploadDir(path.join(root, '12', 'a.png')));
    assert.doesNotThrow(() => assertInsideUploadDir(root));
    assert.throws(() => assertInsideUploadDir('/etc/passwd'));
    process.env.MAX_FILE_SIZE_MB = 'nope';
    assert.equal(maxUploadBytes(), 10 * 1024 * 1024);
    if (prevMb === undefined) delete process.env.MAX_FILE_SIZE_MB;
    else process.env.MAX_FILE_SIZE_MB = prevMb;
    if (prevDir === undefined) delete process.env.UPLOAD_DIR;
    else process.env.UPLOAD_DIR = prevDir;
  });
});
