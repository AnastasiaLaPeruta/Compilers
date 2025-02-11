var _a, _b;
// ChatGPT gave initial suggestion for tracking the line and position number of the input this way
function processInput() {
    const inputElement = document.getElementById("input-code");
    const text = inputElement.value; // Get text from textarea
    const lines = text.split("\n"); // Split into lines based on line breaks
    let position = 0; // Tracks the character position
    let charList = []; //creates array
    let compileOutput = "";
    // loops through all lines
    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
        const line = lines[lineNumber];
        console.log(`Line ${lineNumber + 1}, starts at position ${position}: "${line}"`);
        // Traverses the line character by character
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
            console.log(`  Character ${charIndex + 1} (global position ${position}): '${line[charIndex]}'`);
            charList.push(line[charIndex]); // adds current char to array
            // this is how we are at beginning of a token
            if (charList[0] == "{") { //check to see if fits token options
                compileOutput += "{";
            }
            else if () {
            }
            // else we get an error for invalid token
            else {
            }
            position++; // Move to the next global character position
        }
        charList.length = 0; // clears array to start over since token can't continue past newline char
        position++; // Account for the newline character
    }
    compileCode(compileOutput); // pass final output as parameter
}
// ChatGPT helped to generate initial example of grabbing input and spitting that directly out into output with no changes
function compileCode(compileOutput) {
    const outputElement = document.getElementById("output");
    const result = compileOutput; // This outputs results of compiler
    outputElement.value = String(result);
}
// Attach event listeners correctly
(_a = document.getElementById("compile-btn")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", processInput);
(_b = document.getElementById("compile-btn")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", compileCode);
//# sourceMappingURL=compiler.js.map