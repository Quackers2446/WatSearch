// To run script: ensure the course outlines JSON file is in the root of the project
// with the same name that was given (outline-extract-1259-asu-access 1.json).

import fs from "fs"
import path from "path"

const __dirname = import.meta.dirname
const folder = path.join(__dirname, "app", "courses")

if (!fs.statSync(`${folder}/course-outlines.json`, { throwIfNoEntry: false })) {
    fs.writeFileSync(
        `${folder}/course-outlines.json`,
        JSON.stringify([], null, 0),
        "utf-8",
    )
}
