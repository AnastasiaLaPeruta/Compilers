var _a;
// ChatGPT gave initial suggestion for tracking the line and position number of the input this way
function processInput() {
    const inputElement = document.getElementById("userInput");
    const text = inputElement.value; // Get text from textarea
    const lines = text.split("\n"); // Split into lines based on line breaks
    let position = 0; // Tracks the character position
    let charList = []; // Creates array
    let compileOutput = "";
    let program = 1; // This will increment with each $ and print ending and then new program block
    compileOutput += `INFO Lexer - Lexing program ${program}...\n`;
    // Loops through all lines
    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
        const line = lines[lineNumber];
        console.log(`Line ${lineNumber + 1}, starts at position ${position}: "${line}"`);
        // Traverses the line character by character
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
            console.log(`  Character ${charIndex + 1} (global position ${position}): '${line[charIndex]}'`);
            charList.push(line[charIndex]); // Adds current char to array
            // Detect start of a token
            if (line[charIndex] === "$") {
                // Increment program number, print end and begin of program block and break out of loop
            }
            else if (charList[0] === "{") {
                compileOutput += `DEBUG Lexer - OPEN_BLOCK [ { ] found on line "${line}"\n`;
            }
            // else we get an error for an invalid token (not implemented yet)
            position++; // Move to the next global character position
        }
        charList.length = 0; // Clears array to start over since tokens can't continue past newline char
        position++; // Account for the newline character
    }
    compileCode(compileOutput); // Pass final output as parameter
}
// Function to display the output
function compileCode(compileOutput) {
    const outputElement = document.getElementById("output");
    outputElement.value = compileOutput; // Display compiled output
}
// Attach event listener correctly
(_a = document.getElementById("compile-btn")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", processInput);
//# sourceMappingURL=compiler.js.map