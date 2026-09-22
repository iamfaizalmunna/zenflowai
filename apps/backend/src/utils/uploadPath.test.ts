import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { attachmentStoragePath, decodeBase64File, safeUploadFilename } from './uploadPath';

describe('Phase 8 local upload paths', () => {
  it('strips directory traversal from filenames', () => {
    assert.equal(safeUploadFilename('../../etc/passwd'), 'passwd');
    assert.equal(safeUploadFilename('..\\secret.png'), 'secret.png');
    assert.ok(!safeUploadFilename('../x').includes('..'));
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
});
