// ----------------------- Utility Function ----------------------- //
// Displays output in the element with id "output"
function compileCode(compileOutput) {
    const outputElement = document.getElementById("output");
    outputElement.value = compileOutput;
}
// ----------------------- Lexing Functions ----------------------- //
// Modified lexProgram accepts an optional lineOffset.
// All tokens are reported with line number = (lineOffset + localLineIndex + 1)
function lexProgram(progText, lineOffset = 0) {
    let tokens = [];
    let errors = 0;
    let output = "";
    const lines = progText.split("\n");
    let position = 0;
    // Process each line
    for (let localLine = 0; localLine < lines.length; localLine++) {
        let line = lines[localLine];
        const globalLine = lineOffset + localLine + 1; // Global line number
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
            const char = line[charIndex];
            console.log(`  Character ${charIndex + 1} (global position ${position}): '${char}'`);
            // --- Check for End-of-Program marker ---
            if (char === "$") {
                tokens.push({ type: "EOP", lexeme: "$", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - EOP [ $ ] found on line ${globalLine}\n`;
                continue;
            }
            // --- Punctuation and grouping ---
            else if (char === "{") {
                tokens.push({ type: "LBRACE", lexeme: "{", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - OPEN_BLOCK [ { ] found on line ${globalLine}\n`;
            }
            else if (char === "}") {
                tokens.push({ type: "RBRACE", lexeme: "}", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - CLOSE_BLOCK [ } ] found on line ${globalLine}\n`;
            }
            else if (char === "(") {
                tokens.push({ type: "LPAREN", lexeme: "(", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - LPAREN [ ( ] found on line ${globalLine}\n`;
            }
            else if (char === ")") {
                tokens.push({ type: "RPAREN", lexeme: ")", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - RPAREN [ ) ] found on line ${globalLine}\n`;
            }
            // --- Comments: skip everything between /* and */ ---
            else if (char === "/" && charIndex + 1 < line.length && line[charIndex + 1] === "*") {
                output += `DEBUG Lexer - Comment start [ /* ] found on line ${globalLine}\n`;
                charIndex += 2; // Skip the "/*"
                let commentClosed = false;
                while (localLine < lines.length) {
                    while (charIndex < line.length - 1) {
                        if (line[charIndex] === "*" && line[charIndex + 1] === "/") {
                            commentClosed = true;
                            charIndex += 2; // Skip the "*/"
                            break;
                        }
                        charIndex++;
                    }
                    if (commentClosed)
                        break;
                    localLine++;
                    if (localLine < lines.length) {
                        line = lines[localLine];
                        // update global line number accordingly
                        // Note: column resets to 0 for the new line.
                        charIndex = 0;
                    }
                }
                if (!commentClosed) {
                    output += `ERROR Lexer - Error: Unterminated comment starting on line ${globalLine}. Lexing terminated.\n`;
                    errors++;
                    output += `Error Lexer - Lex failed with ${errors} error(s)\n\n`;
                    compileCode(output);
                    return { tokens, output, errors };
                }
                continue; // Skip further processing inside comment.
            }
            // --- Keywords and operators ---
            else if (line.substring(charIndex, charIndex + 5) === "print") {
                tokens.push({ type: "PRINT", lexeme: "print", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - PRINT [ print ] found on line ${globalLine}\n`;
                charIndex += 4;
            }
            else if (line.substring(charIndex, charIndex + 5) === "while") {
                tokens.push({ type: "WHILE", lexeme: "while", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - WHILE [ while ] found on line ${globalLine}\n`;
                charIndex += 4;
            }
            else if (line.substring(charIndex, charIndex + 2) === "if") {
                tokens.push({ type: "IFSTATEMENT", lexeme: "if", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - IFSTATEMENT [ if ] found on line ${globalLine}\n`;
                charIndex++;
            }
            else if (line.substring(charIndex, charIndex + 4) === "true") {
                tokens.push({ type: "BOOLVALT", lexeme: "true", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - BOOLVALT [ true ] found on line ${globalLine}\n`;
                charIndex += 3;
            }
            else if (line.substring(charIndex, charIndex + 5) === "false") {
                tokens.push({ type: "BOOLVALF", lexeme: "false", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - BOOLVALF [ false ] found on line ${globalLine}\n`;
                charIndex += 4;
            }
            // --- Type keywords ---
            else if (/^(int|string|boolean)/.test(line.substring(charIndex))) {
                let typeLexeme = "";
                if (line.substring(charIndex, charIndex + 3) === "int") {
                    typeLexeme = "int";
                }
                else if (line.substring(charIndex, charIndex + 6) === "string") {
                    typeLexeme = "string";
                }
                else if (line.substring(charIndex, charIndex + 7) === "boolean") {
                    typeLexeme = "boolean";
                }
                tokens.push({ type: "ITYPE", lexeme: typeLexeme, line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - ITYPE [ ${typeLexeme} ] found on line ${globalLine}\n`;
                charIndex += typeLexeme.length - 1;
            }
            // --- Assignment and comparison operators ---
            else if (char === "=") {
                if (charIndex + 1 < line.length && line[charIndex + 1] === "=") {
                    tokens.push({ type: "BOOL_EQUAL", lexeme: "==", line: globalLine, column: charIndex + 1 });
                    output += `DEBUG Lexer - BOOL_EQUAL [ == ] found on line ${globalLine}\n`;
                    charIndex++;
                }
                else {
                    tokens.push({ type: "ASSIGN_OP", lexeme: "=", line: globalLine, column: charIndex + 1 });
                    output += `DEBUG Lexer - ASSIGN_OP [ = ] found on line ${globalLine}\n`;
                }
            }
            else if (char === "!" && charIndex + 1 < line.length && line[charIndex + 1] === "=") {
                tokens.push({ type: "BOOL_INEQUAL", lexeme: "!=", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - BOOL_INEQUAL [ != ] found on line ${globalLine}\n`;
                charIndex++;
            }
            else if (char === "+") {
                tokens.push({ type: "INTOP", lexeme: "+", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - INTOP [ + ] found on line ${globalLine}\n`;
            }
            // --- String Expressions ---
            else if (char === '"') {
                tokens.push({ type: "LQUOTE", lexeme: "\"", line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - StringExpr [ start " ] found on line ${globalLine}\n`;
                charIndex++; // move past the opening quote
                while (charIndex < line.length) {
                    if (line[charIndex] === '"') {
                        tokens.push({ type: "RQUOTE", lexeme: "\"", line: globalLine, column: charIndex + 1 });
                        output += `DEBUG Lexer - StringExpr [ end " ] found on line ${globalLine}\n`;
                        break;
                    }
                    else {
                        let currentChar = line[charIndex];
                        if ((currentChar >= "a" && currentChar <= "z") || currentChar === " ") {
                            tokens.push({ type: "CHAR", lexeme: currentChar, line: globalLine, column: charIndex + 1 });
                            output += `DEBUG Lexer - char [ ${currentChar} ] found on line ${globalLine}\n`;
                        }
                        else {
                            output += `ERROR Lexer - Error: line ${globalLine} Unrecognized Token: ${currentChar} Only lowercase letters a through z and spaces are allowed in strings\n`;
                            output += `Error Lexer - Lex failed with ${errors + 1} error(s)\n\n`;
                            compileCode(output);
                            return { tokens, output, errors: errors + 1 };
                        }
                    }
                    charIndex++;
                }
                if (charIndex >= line.length || line[charIndex] !== '"') {
                    output += `ERROR Lexer - Error: Unterminated StringExpr starting on line ${globalLine}. Lexing terminated due to fatal error.\n`;
                    output += `Error Lexer - Lex failed with ${errors + 1} error(s)\n\n`;
                    compileCode(output);
                    return { tokens, output, errors: errors + 1 };
                }
            }
            // --- Digits ---
            else if (/[0-9]/.test(char)) {
                tokens.push({ type: "DIGIT", lexeme: char, line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - DIGIT [ ${char} ] found on line ${globalLine}\n`;
            }
            // --- Identifiers (a single character) ---
            else if (char >= "a" && char <= "z") {
                tokens.push({ type: "ID", lexeme: char, line: globalLine, column: charIndex + 1 });
                output += `DEBUG Lexer - ID [ ${char} ] found on line ${globalLine}\n`;
            }
            // --- Ignore whitespace ---
            else if (char === " " || char === "\t") {
                // do nothing
            }
            // --- Unrecognized token ---
            else {
                errors++;
                output += `ERROR Lexer - Error: line ${globalLine} Unrecognized Token: ${char} Please reference grammar guide.\n`;
            }
            position++;
        }
        position++; // Account for newline
    }
    // Check that the program ends with "$"
    let trimmedText = progText.replace(/\s+$/, "");
    if (!trimmedText.endsWith("$")) {
        output += `ERROR Lexer - Error: last line of program - Please complete program with "$" as your last character.\n`;
        errors++;
        output += `Error Lexer - Lex failed with ${errors} error(s)\n\n`;
        compileCode(output);
        return { tokens, output, errors };
    }
    output += `LEXER: Lex completed successfully with ${errors} error(s)\n\n`;
    return { tokens, output, errors };
}
// ----------------------- Program Processing ----------------------- //
// This function splits the input (which may contain multiple programs separated by "$"),
// computes a global line offset for each program, and then lexes and parses each.
function processPrograms() {
    let finalOutput = "DEBUG: Running in verbose mode \n\n";
    const inputElement = document.getElementById("userInput");
    const text = inputElement.value;
    if (!text.trim().endsWith("$")) {
        compileCode(`ERROR: Last character of input must be "$".\n`);
        return;
    }
    // Split input into raw programs (preserving newlines)
    const rawPrograms = text.split("$");
    const programs = [];
    let cumulativeLineCount = 0;
    for (const raw of rawPrograms) {
        // Only consider parts that are not empty when trimmed.
        if (raw.trim().length > 0) {
            programs.push({ program: raw + "$", offset: cumulativeLineCount });
        }
        // Update cumulativeLineCount by counting newlines in raw.
        cumulativeLineCount += (raw.match(/\n/g) || []).length;
    }
    let programNumber = 1;
    for (const { program, offset } of programs) {
        const lexResult = lexProgram(program, offset);
        let compileOutput = `LEXER - Lexing program ${programNumber}...\n` + lexResult.output;
        if (lexResult.errors === 0) {
            compileOutput += `PARSER: Parsing program ${programNumber}...\n`;
            const parserInstance = new Parser(lexResult.tokens);
            const result = parserInstance.parse();
            compileOutput += result.output;
            if (result.error) {
                compileOutput += `\nPARSER ERROR: ${result.error}\n`;
                compileOutput += `CST for program ${programNumber}: Skipped due to PARSER error(s).\n`;
            }
            else if (result.tree) {
                compileOutput += `PARSER: Parse completed successfully\n`;
                compileOutput += `\nCST for program ${programNumber}:\n` + result.tree.print();
            }
        }
        finalOutput += compileOutput + "\n";
        programNumber++;
    }
    compileCode(finalOutput);
}
// ----------------------- Parser and CST Classes ----------------------- //
class Parser {
    constructor(tokens) {
        this.current = 0;
        this.output = "";
        this.tokens = tokens;
        this.cst = new CST();
    }
    // Peek at the current token.
    peekToken() {
        return this.current < this.tokens.length ? this.tokens[this.current] : null;
    }
    // Begin parsing.
    parse() {
        try {
            this.output += "PARSER: parse() called\n";
            this.parseProgram();
            return { output: this.output, tree: this.cst, error: null };
        }
        catch (error) {
            if (error instanceof Error) {
                return { output: this.output, tree: null, error: error.message };
            }
            else {
                return { output: this.output, tree: null, error: "An unknown error occurred" };
            }
        }
    }
    // Program ::= Block EOP
    parseProgram() {
        this.output += "PARSER: parseProgram()\n";
        this.cst.addNode("branch", "Program");
        this.parseBlock();
        this.match("EOP");
        this.cst.moveUp();
    }
    // Block ::= { StatementList }
    parseBlock() {
        this.output += "PARSER: parseBlock()\n";
        this.cst.addNode("branch", "Block");
        this.match("LBRACE");
        // Create the Statement List node once.
        this.cst.addNode("branch", "Statement List");
        this.parseStatementList();
        this.cst.moveUp(); // finish Statement List
        this.match("RBRACE");
        this.cst.moveUp();
    }
    // StatementList ::= Statement StatementList | ε
    parseStatementList() {
        this.output += "PARSER: parseStatementList()\n";
        const token = this.peekToken();
        if (token && (token.type !== "RBRACE" && token.type !== "EOP")) {
            this.parseStatement();
            this.parseStatementList();
        }
        // When the next token is RBRACE/EOP, do nothing (no node added)
    }
    // Statement ::= PrintStatement | AssignmentStatement | VarDecl | WhileStatement | IfStatement | Block
    parseStatement() {
        this.output += "PARSER: parseStatement()\n";
        this.cst.addNode("branch", "Statement");
        const token = this.peekToken();
        if (!token) {
            throw new Error("PARSER ERROR: Unexpected end of input in parseStatement");
        }
        if (token.type === "PRINT") {
            this.parsePrintStatement();
        }
        else if (token.type === "IFSTATEMENT") {
            this.parseIfStatement();
        }
        else if (token.type === "WHILE") {
            this.parseWhileStatement();
        }
        else if (token.type === "ITYPE") {
            this.parseVarDecl();
        }
        else if (token.type === "ID") {
            this.parseAssignmentStatement();
        }
        else if (token.type === "LBRACE") {
            this.parseBlock();
        }
        else {
            throw new Error(`PARSER ERROR: Unexpected token ${token.lexeme} at line ${token.line} in parseStatement`);
        }
        this.cst.moveUp();
    }
    // PrintStatement ::= print ( Expr )
    parsePrintStatement() {
        this.output += "PARSER: parsePrintStatement()\n";
        this.cst.addNode("branch", "PrintStatement");
        this.match("PRINT");
        this.match("LPAREN");
        this.parseExpr();
        this.match("RPAREN");
        this.cst.moveUp();
    }
    // AssignmentStatement ::= Id = Expr
    parseAssignmentStatement() {
        this.output += "PARSER: parseAssignmentStatement()\n";
        this.cst.addNode("branch", "AssignmentStatement");
        this.match("ID");
        this.match("ASSIGN_OP");
        this.parseExpr();
        this.cst.moveUp();
    }
    // VarDecl ::= type Id
    parseVarDecl() {
        this.output += "PARSER: parseVarDecl()\n";
        this.cst.addNode("branch", "VarDecl");
        this.match("ITYPE");
        this.match("ID");
        this.cst.moveUp();
    }
    // WhileStatement ::= while BooleanExpr Block
    parseWhileStatement() {
        this.output += "PARSER: parseWhileStatement()\n";
        this.cst.addNode("branch", "WhileStatement");
        this.match("WHILE");
        this.parseBooleanExpr();
        this.parseBlock();
        this.cst.moveUp();
    }
    // IfStatement ::= if BooleanExpr Block
    parseIfStatement() {
        this.output += "PARSER: parseIfStatement()\n";
        this.cst.addNode("branch", "IfStatement");
        this.match("IFSTATEMENT");
        this.parseBooleanExpr();
        this.parseBlock();
        this.cst.moveUp();
    }
    // Expr ::= IntExpr | StringExpr | BooleanExpr | Id | boolval
    parseExpr() {
        this.output += "PARSER: parseExpr()\n";
        this.cst.addNode("branch", "Expr");
        const token = this.peekToken();
        if (!token) {
            throw new Error("PARSER ERROR: Unexpected end of input in parseExpr");
        }
        if (token.type === "DIGIT") {
            this.parseIntExpr();
        }
        else if (token.type === "LQUOTE") {
            this.parseStringExpr();
        }
        else if (token.type === "LPAREN") {
            this.parseBooleanExpr();
        }
        else if (token.type === "ID") {
            this.match("ID");
        }
        else if (token.type === "BOOLVALT" || token.type === "BOOLVALF") {
            this.match(token.type);
        }
        else {
            throw new Error(`PARSER ERROR: Unexpected token ${token.lexeme} at line ${token.line} in parseExpr`);
        }
        this.cst.moveUp();
    }
    // IntExpr ::= digit intop Expr | digit
    parseIntExpr() {
        this.output += "PARSER: parseIntExpr()\n";
        this.cst.addNode("branch", "IntExpr");
        this.match("DIGIT");
        const token = this.peekToken();
        if (token && token.type === "INTOP") {
            this.match("INTOP");
            this.parseExpr();
        }
        this.cst.moveUp();
    }
    // StringExpr ::= " CharList "
    parseStringExpr() {
        this.output += "PARSER: parseStringExpr()\n";
        this.cst.addNode("branch", "StringExpr");
        this.match("LQUOTE");
        this.parseCharList();
        this.match("RQUOTE");
        this.cst.moveUp();
    }
    // BooleanExpr ::= ( Expr boolop Expr ) | boolval
    parseBooleanExpr() {
        this.output += "PARSER: parseBooleanExpr()\n";
        this.cst.addNode("branch", "BooleanExpr");
        const token = this.peekToken();
        if (token && token.type === "LPAREN") {
            this.match("LPAREN");
            this.parseExpr();
            this.parseBoolOp();
            this.parseExpr();
            this.match("RPAREN");
        }
        else if (token && (token.type === "BOOLVALT" || token.type === "BOOLVALF")) {
            this.match(token.type);
        }
        else {
            throw new Error(`PARSER ERROR: Expected BooleanExpr but got ${token ? token.lexeme : "EOF"} at line ${token === null || token === void 0 ? void 0 : token.line}`);
        }
        this.cst.moveUp();
    }
    // BoolOp ::= == | !=
    parseBoolOp() {
        this.output += "PARSER: parseBoolOp()\n";
        this.cst.addNode("branch", "BoolOp");
        const token = this.peekToken();
        if (token && (token.type === "BOOL_EQUAL" || token.type === "BOOL_INEQUAL")) {
            this.match(token.type);
        }
        else {
            throw new Error(`PARSER ERROR: Expected boolean operator but got ${token ? token.lexeme : "EOF"} at line ${token === null || token === void 0 ? void 0 : token.line}`);
        }
        this.cst.moveUp();
    }
    // CharList ::= CHAR CharList | space CharList | ε
    parseCharList() {
        this.output += "PARSER: parseCharList()\n";
        this.cst.addNode("branch", "CharList");
        const token = this.peekToken();
        if (token && token.type === "CHAR") {
            this.match("CHAR");
            this.parseCharList();
        }
        else {
            this.cst.addNode("leaf", "ε");
        }
        this.cst.moveUp();
    }
    // Utility: consume a token if it matches the expected type.
    match(expected) {
        const token = this.tokens[this.current];
        if (token && token.type === expected) {
            this.cst.addNode("leaf", token.lexeme);
            this.current++;
        }
        else {
            throw new Error(`PARSER ERROR: Expected ${expected} but got ${token ? token.lexeme : "EOF"} at line ${token === null || token === void 0 ? void 0 : token.line}`);
        }
    }
}
// CST Classes
class CSTNode {
    constructor(label) {
        this.label = label;
        this.children = [];
        this.parent = null;
    }
}
class CST {
    constructor() {
        this.root = null;
        this.current = null;
    }
    addNode(kind, label) {
        const newNode = new CSTNode(label);
        if (this.root === null) {
            this.root = newNode;
            this.current = newNode;
        }
        else {
            if (this.current) {
                newNode.parent = this.current;
                this.current.children.push(newNode);
            }
            if (kind === "branch") {
                this.current = newNode;
            }
        }
    }
    moveUp() {
        if (this.current && this.current.parent) {
            this.current = this.current.parent;
        }
    }
    print(node = this.root, depth = 0) {
        if (!node)
            return "";
        const indent = "-".repeat(depth);
        let displayLabel;
        // If it's a punctuation token, use square brackets
        if (node.label === "{" || node.label === "}" || node.label === "$") {
            displayLabel = `[${node.label}]`;
        }
        else if (node.label === "StatementList") {
            // Replace "StatementList" with "Statement List"
            displayLabel = `<Statement List>`;
        }
        else {
            displayLabel = `<${node.label}>`;
        }
        let result = indent + displayLabel + "\n";
        for (const child of node.children) {
            result += this.print(child, depth + 1);
        }
        return result;
    }
}
// ----------------------- DOM Event Listener ----------------------- //
document.addEventListener("DOMContentLoaded", () => {
    const compileBtn = document.getElementById("compile-btn");
    if (!compileBtn) {
        console.error("Compile button not found! Check that the id is 'compile-btn' in your HTML.");
        return;
    }
    compileBtn.addEventListener("click", () => {
        try {
            processPrograms();
        }
        catch (err) {
            console.error("Compilation error:", err);
            compileCode("Compilation error: " + err);
        }
    });
});
//# sourceMappingURL=compiler.js.map