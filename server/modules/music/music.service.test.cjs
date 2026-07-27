const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const musicService = require('./music.service');
const ABCFileModel = require('../../models/ABCFile');

ABCFileModel.prototype.save = async function save() {
  return this;
};

test('processMusicUpload surfaces an OCR conversion error for score images when tooling is unavailable', async () => {
  const uploadName = `test-upload-${Date.now()}.pdf`;
  const fakeFile = { filename: uploadName };

  await assert.rejects(
    () => musicService.processMusicUpload(fakeFile),
    /OCR conversion failed|Audiveris service did not produce ABC output/i,
    'expected OCR failure to be surfaced instead of silent fallback'
  );
});

test('processMusicUpload uses the audiveris service response when available', async () => {
  const uploadName = `service-upload-${Date.now()}.png`;
  const fakeFile = { filename: uploadName };
  const uploadedFilePath = path.join(__dirname, '../../uploads', uploadName);

  fs.mkdirSync(path.dirname(uploadedFilePath), { recursive: true });
  fs.writeFileSync(uploadedFilePath, 'fake-upload');

  const server = http.createServer((req, res) => {
    if (req.url === '/convert') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, abc: 'X:1\nT:Service Response\nM:4/4\nL:1/4\nK:C\nV:1\n"Service Response" z4\n' }));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const serviceUrl = `http://127.0.0.1:${address.port}/convert`;
  process.env.AUDIVERIS_SERVICE_URL = serviceUrl;

  try {
    const result = await musicService.processMusicUpload(fakeFile);

    const expectedAbcPath = path.join(
      __dirname,
      '../../uploads',
      path.parse(uploadName).name,
      `${path.parse(uploadName).name}.abc`
    );

    const content = fs.readFileSync(expectedAbcPath, 'utf8');
    assert.match(content, /Service Response/, 'expected the service-provided ABC content to be written');
    assert.equal(result.message, 'File uploaded and processed successfully');
  } finally {
    process.env.AUDIVERIS_SERVICE_URL = '';
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
