const fs = require('fs');
const imgBase64 = fs.readFileSync('RGTlogo_only.jpeg').toString('base64');
const imgTag = '<img src="data:image/jpeg;base64,' + imgBase64 + '" style="width: 250px; display: block; margin: 0 auto; margin-bottom: 5px;" alt="RGTVertex Logo">';

const templatePath = 'server/templates/offerTemplate.html';
let content = fs.readFileSync(templatePath, 'utf8');

const regex = /<svg viewBox="0 0 100 80" class="logo-svg"[\s\S]*?<\/svg>\s*<h1 class="logo-text">RGTVertex<\/h1>/;
if (regex.test(content)) {
    content = content.replace(regex, imgTag);
    fs.writeFileSync(templatePath, content);
    console.log('Successfully updated logo.');
} else {
    console.log('Could not find the SVG logo to replace.');
}
