/**
 * server.js
 * MedRoute Backend API
 * ============================================================
 * Express server that:
 *  1. Accepts MedRoute source code via POST /compile
 *  2. Writes it to a temp file
 *  3. Invokes the compiled medroute binary
 *  4. Returns the JSON output to the frontend
 *
 * CORS is enabled for the Vite dev server (localhost:5173).
 */

const express    = require('express');
const cors       = require('cors');
const { execFile } = require('child_process');
const fs         = require('fs');
const path       = require('path');
const os         = require('os');

const app  = express();
const PORT = 3001;

/* ============================================================
 * MIDDLEWARE
 * ============================================================ */
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json({ limit: '1mb' }));

/* ============================================================
 * COMPILER PATH
 * Adjust this to wherever `make` puts the binary.
 * On Windows with WSL: call via wsl ./medroute ...
 * On Linux/macOS: just ./medroute
 * ============================================================ */
const COMPILER_DIR = path.join(__dirname, '..', 'compiler');

/* Detect platform and choose the right invocation */
function getCompilerCmd(tempFile) {
    const isWindows = process.platform === 'win32';
    if (isWindows) {
        // Binary compiled natively with MSYS2 gcc — call .exe directly
        // Also add MSYS2 bin to PATH so the .exe can find its DLLs
        return {
            cmd: path.join(COMPILER_DIR, 'medroute.exe'),
            args: [tempFile],
            env: {
                ...process.env,
                PATH: `C:\\msys64\\ucrt64\\bin;C:\\msys64\\usr\\bin;${process.env.PATH}`
            }
        };
    } else {
        return {
            cmd: path.join(COMPILER_DIR, 'medroute'),
            args: [tempFile],
            env: process.env
        };
    }
}

/* ============================================================
 * POST /compile
 * Body: { source: "PATIENT P101\n..." }
 * Returns: full compiler JSON output
 * ============================================================ */
app.post('/compile', (req, res) => {
    const { source } = req.body;

    if (!source || typeof source !== 'string') {
        return res.status(400).json({ error: 'Missing source code in request body.' });
    }

    /* Write source to a temp .med file */
    const tmpFile = path.join(os.tmpdir(), `medroute_${Date.now()}.med`);

    fs.writeFile(tmpFile, source, 'utf8', (writeErr) => {
        if (writeErr) {
            return res.status(500).json({ error: 'Failed to create temp file.', detail: writeErr.message });
        }

        const { cmd, args, env } = getCompilerCmd(tmpFile);

        execFile(cmd, args, { timeout: 10000, env }, (execErr, stdout, stderr) => {
            /* Clean up temp file */
            fs.unlink(tmpFile, () => {});

            /* Exit code 2 means compiler found errors but still produced valid JSON */
            if (execErr && execErr.code !== 2) {
                /* Try to parse stdout anyway — compiler may still emit partial JSON */
                if (stdout && stdout.trim().startsWith('{')) {
                    try {
                        const result = JSON.parse(stdout);
                        return res.json(result);
                    } catch (_) {}
                }
                return res.status(500).json({
                    error: 'Compiler execution failed.',
                    detail: execErr.message,
                    stderr: stderr
                });
            }

            /* Parse the JSON output from the compiler */
            try {
                const result = JSON.parse(stdout);
                return res.json(result);
            } catch (parseErr) {
                return res.status(500).json({
                    error: 'Compiler produced invalid JSON.',
                    raw: stdout.substring(0, 2000),
                    detail: parseErr.message
                });
            }
        });
    });
});

/* ============================================================
 * GET /examples/:name
 * Returns the raw source of a built-in example
 * ============================================================ */
const EXAMPLES_DIR = path.join(__dirname, '..', 'examples');

app.get('/files', (req, res) => {
    fs.readdir(EXAMPLES_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: 'Could not list files.' });
        const medFiles = files.filter(f => f.endsWith('.med'));
        const result = [];
        let processed = 0;
        if (medFiles.length === 0) return res.json([]);
        
        medFiles.forEach(file => {
            const filepath = path.join(EXAMPLES_DIR, file);
            fs.stat(filepath, (statErr, stats) => {
                if (statErr) {
                    processed++;
                    if (processed === medFiles.length) res.json(result);
                    return;
                }
                fs.readFile(filepath, 'utf8', (readErr, content) => {
                    if (!readErr) {
                        result.push({
                            name: file,
                            content: content,
                            savedAt: stats.mtime
                        });
                    }
                    processed++;
                    if (processed === medFiles.length) {
                        result.sort((a, b) => b.savedAt - a.savedAt);
                        res.json(result);
                    }
                });
            });
        });
    });
});

app.post('/files', (req, res) => {
    let { name, content } = req.body;
    if (!name || typeof name !== 'string' || !content) {
        return res.status(400).json({ error: 'Invalid request. Provide name and content.' });
    }
    name = path.basename(name);
    if (!name.endsWith('.med')) name += '.med';
    
    const filepath = path.join(EXAMPLES_DIR, name);
    fs.writeFile(filepath, content, 'utf8', (err) => {
        if (err) return res.status(500).json({ error: 'Could not write file.' });
        fs.stat(filepath, (statErr, stats) => {
            res.json({ name, content, savedAt: stats ? stats.mtime : new Date() });
        });
    });
});

app.delete('/files/:name', (req, res) => {
    const name = path.basename(req.params.name);
    const filepath = path.join(EXAMPLES_DIR, name);
    fs.unlink(filepath, (err) => {
        if (err && err.code !== 'ENOENT') return res.status(500).json({ error: 'Could not delete file.' });
        res.json({ success: true });
    });
});

/* ============================================================
 * Health check
 * ============================================================ */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', compiler: COMPILER_DIR });
});

/* ============================================================
 * START
 * ============================================================ */
app.listen(PORT, () => {
    console.log(`MedRoute backend running at http://localhost:${PORT}`);
    console.log(`Compiler path: ${COMPILER_DIR}`);
});
