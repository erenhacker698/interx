const fs = require("fs");
const path = require("path");
const CONFIG_PATH = path.join(__dirname, "data/tempvc_config.json");
try {
    if (!fs.existsSync(path.join(__dirname, "data"))) {
        fs.mkdirSync(path.join(__dirname, "data"));
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ test: "success" }, null, 2));
    console.log("Success: Written to", CONFIG_PATH);
} catch (e) {
    console.error("Failure:", e);
}
