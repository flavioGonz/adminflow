const fs = require('fs');
const indexPath = '/opt/adminflow/server/index.js';
let content = fs.readFileSync(indexPath, 'utf8');

// The faulty code has 'catch (err) { res.status(500).json({ message: err.message }); } }));'
// It should be 'catch (err) { res.status(500).json({ message: err.message }); } });'

const faulty = "catch (err) {\n        res.status(500).json({ message: err.message });\n    }\n}));";
const fixed = "catch (err) {\n        res.status(500).json({ message: err.message });\n    }\n});";

if (content.includes(faulty)) {
    content = content.replace(faulty, fixed);
    console.log('Fixed syntax error in POST /api/tickets');
} else {
    // Try with different indentation or spacing
    const regex = /catch\s*\(err\)\s*{\s*res\.status\(500\)\.json\({\s*message:\s*err\.message\s*}\);\s*}\s*}\)\);/g;
    if (regex.test(content)) {
        content = content.replace(regex, "catch (err) {\n        res.status(500).json({ message: err.message });\n    }\n});");
        console.log('Fixed syntax error via regex');
    } else {
        console.log('Faulty pattern not found');
        // Let's look at the context again to be sure
    }
}

fs.writeFileSync(indexPath, content);
