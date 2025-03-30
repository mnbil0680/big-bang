const fs = require("fs");

const fontPath = "Amiri-Regular.ttf"; // Update path if necessary
const outputPath = "amiri_base64.txt";

fs.readFile(fontPath, (err, data) => {
  if (err) throw err;
  const base64 = data.toString("base64");
  fs.writeFileSync(outputPath, base64);
  console.log("Base64 string saved successfully.");
});
