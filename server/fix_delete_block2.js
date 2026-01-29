const fs = require('fs');
const indexPath = '/opt/adminflow/server/index.js';
let content = fs.readFileSync(indexPath, 'utf8');
const target = `    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}));

app.delete('/api/tickets/:id', async (req, res) => {
`;
const replacement = `    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.delete('/api/tickets/:id', async (req, res) => {
`;
if (!content.includes(target)) {
    throw new Error('target not found');
}
content = content.replace(target, replacement);
fs.writeFileSync(indexPath, content);
