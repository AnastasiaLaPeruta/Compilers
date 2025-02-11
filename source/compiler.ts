// ChatGPT gave initial suggestion for tracking the line and position number of the input this way
function processInput() {
    const inputElement = document.getElementById("userInput") as HTMLTextAreaElement;
    const text = inputElement.value; // Get text from textarea

    const lines = text.split("\n"); // Split into lines based on line breaks
    let position = 0; // Tracks the character position

    let charList: string[] = [];    // Creates array
    let compileOutput = "";
    let errors = 0;
    let program = 1; // This will increment with each $ and print ending and then new program block
    compileOutput += `INFO Lexer - Lexing program ${program}...\n`;

    // Loops through all lines
    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
        const line = lines[lineNumber];

        // Traverses the line character by character
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
            console.log(`  Character ${charIndex + 1} (global position ${position}): '${line[charIndex]}'`);
            charList.push(line[charIndex]); // Adds current char to array

            // Detect start of a token
            if (line[charIndex] === "$") {
                // Increment program number, print end and begin of program block and break out of loop
                compileOutput += `DEBUG Lexer -  EOP [ $ ] found on line ${lineNumber + 1}\n`;
                if (errors == 0){ // if no errors
                    compileOutput += `INFO Lexer - Lex completed with  ${errors} errors\n\n`;
                }
                else{ // if any errors present
                    compileOutput += `Error Lexer - Lex failed with  ${errors} error(s)\n\n`;
                }
                errors = 0; // reset errors
                program += 1;
                if (line[charIndex+1] == "$"){ // if two program endings in a row we have a warning
                    compileOutput += `WARNING Lexer - Warning: line ${lineNumber + 1} - Extra "$". Program will continue to execute assuming you meant to do this...\n\n`;
                }
                charList.length = 0; // end of program means end of token
                // executes only if there is more in program (either more lines or more characters on that final line)
                if (line.substring(charIndex + 1).trim().length > 0 ||  // Non-space chars after `$`
                lines.slice(lineNumber + 1).some(l => l.trim().length > 0)){ // Any remaining non-empty lines? ChatGPT helped turn this idea into code that accurately checks these conditions
                    compileOutput += `INFO Lexer - Lexing program ${program}...\n`;
                }
            } 
            else if (line[charIndex] === "{") {
                compileOutput += `DEBUG Lexer - OPEN_BLOCK [ { ] found on line ${lineNumber + 1}\n`;
            } 
            else if (line[charIndex] === "}") {
                compileOutput += `DEBUG Lexer - CLOSE_BLOCK [ } ] found on line ${lineNumber + 1}\n`; 
            }
            //ChatGPT provided this method rather than the indefinite loop I realized I had that did not report unterminated comment error
            else if (line[charIndex] == "/" && line[charIndex + 1] == "*") { 
                let commentClosed = false; // Track if `*/` is found
                charIndex += 2; // Move past `/*`
            
                while (lineNumber < lines.length) { // Loop through lines
                    while (charIndex < lines[lineNumber].length - 1) { // Loop through characters
                        if (lines[lineNumber][charIndex] === "*" && lines[lineNumber][charIndex + 1] === "/") {
                            commentClosed = true; // Found closing `*/`
                            charIndex++; // Move past `*/`
                            break;
                        }
                        charIndex++; // Continue scanning inside the comment
                    }
            
                    if (commentClosed) break; // Exit loop if `*/` was found
                    
                    lineNumber++; // Move to the next line
                    charIndex = 0; // Reset char position for new line
                }
            
                // If the comment was never closed, add an error and **STOP LEXING**
                if (!commentClosed) {
                    errors+=1;
                    compileOutput += `ERROR Lexer - Error: Unterminated comment starting on line ${lineNumber + 1}. Lexing terminated due to fatal error.\n`;
                    compileOutput += `Error Lexer - Lex failed with  ${errors} error(s)\n\n`;
                    compileCode(compileOutput); // Output immediately
                    return; // **STOP all further processing**
                }
            }
            
            // checks for every other valid token now

            // print check
            else if (line.substring(charIndex, charIndex + 6) === "print(") { // ChatGPT helped to improve what I had and found a way to track end of print
                let printClosed = false; // Track if `)` is found
                let printStartLine = lineNumber + 1; // Store where `print(` starts
                charIndex += 6; // Move past `print(`
                compileOutput += `DEBUG Lexer - PRINT [ print() ] found on line ${lineNumber + 1}\n`;
                while (lineNumber < lines.length) { // Loop through lines
                    while (charIndex < lines[lineNumber].length) { // Loop through characters
                        if (lines[lineNumber][charIndex] === ")") {
                            printClosed = true; // Found closing `)`
                            break;
                        }
                        charIndex++; // Continue scanning inside print()
                    }
            
                    if (printClosed) break; // Exit loop if `)` was found
                    
                    lineNumber++; // Move to the next line
                    charIndex = 0; // Reset char position for new line
                }
            
                // If `print(` was never closed, add an error and STOP LEXING
                if (!printClosed) {
                    compileOutput += `ERROR Lexer - Error: Unterminated print() starting on line ${printStartLine}. Lexing terminated due to fatal error.\n`;
                    compileOutput += `Error Lexer - Lex failed with ${errors + 1} errors\n\n`;
                    compileCode(compileOutput); // Output immediately
                    return; // **STOP all further processing**
                }
            }
            
            else if(line[charIndex] == "=" && line[charIndex+1] == "="){
                compileOutput += `DEBUG Lexer - BOOL_EQUAL [ == ] found on line ${lineNumber + 1}\n`;
                charIndex ++;
            }

            else if(line[charIndex] == "="){ // don't have to worry about == because it checks for that before this case
                compileOutput += `DEBUG Lexer - ASSIGN_OP [ = ] found on line ${lineNumber + 1}\n`;
            }

            else if(line[charIndex] == "!" && line[charIndex+1] == "="){
                compileOutput += `DEBUG Lexer - BOOL_INEQUAL [ != ] found on line ${lineNumber + 1}\n`;
                charIndex ++;
            }

            // makes sure quotes get closed
            else if (line[charIndex] === '"') { 
                let quoteClosed = false; // Track if `"` is found
                let quoteStartLine = lineNumber + 1; // Store where `"` starts
                charIndex ++; // Move past `"`
                compileOutput += `DEBUG Lexer - StringExpr [ start " ] found on line ${lineNumber + 1}\n`;
                while (lineNumber < lines.length) { // Loop through lines
                    while (charIndex < lines[lineNumber].length) { // Loop through characters
                        if (lines[lineNumber][charIndex] === '"') {
                            quoteClosed = true; // Found closing `"`
                            compileOutput += `DEBUG Lexer - StringExpr [ end " ] found on line ${lineNumber + 1}\n`;
                            break;
                        }
                        charIndex++; // Continue scanning inside ""
                    }
            
                    if (quoteClosed) break; // Exit loop if `"` was found
                    
                    lineNumber++; // Move to the next line
                    charIndex = 0; // Reset char position for new line
                }
            
                // If `"` was never closed, add an error and STOP LEXING
                if (!quoteClosed) {
                    compileOutput += `ERROR Lexer - Error: Unterminated StringExpr starting on line ${quoteStartLine}. Lexing terminated due to fatal error.\n`;
                    compileOutput += `Error Lexer - Lex failed with ${errors + 1} errors\n\n`;
                    compileCode(compileOutput); // Output immediately
                    return; // **STOP all further processing**
                }
            }

            // else we get increment error for an invalid token (not implemented yet)

            position++; // Move to the next global character position
        }
        charList.length = 0; // Clears array to start over since tokens can't continue past newline char
        position++; // Account for the newline character
    }


    // ChatGPT helped to implement my idea that there should be an error if input doesnt end with $ or end of comment
    let trimmedText = text.replace(/\s+$/, ""); // Remove trailing spaces
    if (!(trimmedText.endsWith("$") || trimmedText.endsWith("*/"))) {
        compileOutput += `ERROR Lexer - Error: last line of program - Last character must be "$" or "*/".\n`;
        errors++;
        compileOutput += `Error Lexer - Lex failed with  ${errors} error(s)\n\n`;
    }

    compileCode(compileOutput); // Pass final output as parameter
}

// Function to display the output
function compileCode(compileOutput: string) {
    const outputElement = document.getElementById("output") as HTMLTextAreaElement;
    outputElement.value = compileOutput; // Display compiled output
}

// Attach event listener correctly
document.getElementById("compile-btn")?.addEventListener("click", processInput);
