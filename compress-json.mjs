// To run script: ensure the course outlines JSON file is in the root of the project
// with the same name that was given (outline-extract-1259-asu-access 1.json).

import fs from "fs/promises"
import path from "path"

const __dirname = import.meta.dirname
const folder = path.join(__dirname, "app", "courses")

const contents = await fs.readFile(
    `${__dirname}/outline-extract-1259-asu-access 1.json`,
    "utf-8",
)
const data = JSON.parse(contents)

await fs.writeFile(
    `${folder}/course-outlines.json`,
    JSON.stringify(data, null, 0),
    "utf-8",
)

console.log("Done")
