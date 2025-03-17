// ----------------------- Utility Function ----------------------- //
// Displays output in the element with id "output"
function compileCode(compileOutput) {
    const outputElement = document.getElementById("output");
    outputElement.value = compileOutput;
}
// ----------------------- Lexing Functions ----------------------- //
// This function encapsulates the lexing loop for a single program (the text before the '$' marker).
// It produces tokens (with line/column info) and prints debug messages.
function lexProgram(progText) {
    let tokens = [];
    let errors = 0;
    let output = "";
    const lines = progText.split("\n");
    let position = 0;
    // Process each line
    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
        let line = lines[lineNumber];
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
            const char = line[charIndex];
            console.log(`  Character ${charIndex + 1} (global position ${position}): '${char}'`);
            // --- Check for End-of-Program marker ---
            if (char === "$") {
                tokens.push({ type: "EOP", lexeme: "$", line: lineNumber + 1, column: charIndex + 1 });
                output += `DEBUG Lexer - EOP [ $ ] found on line ${lineNumber + 1}\n`;
                continue;
            }
            // --- Punctuation and grouping ---
            else if (char === "{") {
                tokens.push({ type: "LBRACE", lexeme: "{", line: lineNumber + 1, column: charIndex + 1 });
                output += `DEBUG Lexer - OPEN_BLOCK [ { ] found on line ${lineNumber + 1}\n`;
            }
            else if (char === "}") {
                tokens.push({ type: "RBRACE", lexeme: "}", line: lineNumber + 1, column: charIndex + 1 });
                output += `DEBUG Lexer - CLOSE_BLOCK [ } ] found on line ${lineNumber + 1}\n`;
            }
            else if (char === "(") {
                tokens.push({ type: "LPAREN", lexeme: "(", line: lineNumber + 1, column: charIndex + 1 });
                output += `DEBUG Lexer - LPAREN [ ( ] found on line ${lineNumber + 1}\n`;
            }
            else if (char === ")") {
                tokens.push({ type: "RPAREN", lexeme: ")", line: lineNumber + 1, column: charIndex + 1 });
                output += `DEBUG Lexer - RPAREN [ ) ] found on line ${lineNumber + 1}\n`;
            }
            // --- Comments: skip everything between /* and */ ---
            else if (char === "/" && charIndex + 1 < line.length && line[charIndex + 1] === "*") {
                output += `DEBUG Lexer - Comment start [ /* ] found on line ${lineNumber + 1}\n`;
                charIndex += 2; // Skip the "/*"
                let commentClosed = false;
                while (lineNumber < lines.length) {
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
                    lineNumber++;
                    if (lineNumber < lines.length) {
                        line = lines[lineNumber];
                        charIndex = 0;
                    }
                }
                if (!commentClosed) {
                    output += `ERROR Lexer - Error: Unterminated comment starting on line ${lineNumber + 1}. Lexing terminated.\n`;
                    errors++;
                    output += `Error Lexer - Lex failed with ${errors} error(s)\n\n`;
                    compileCode(output);
                    return { tokens, output, errors };
                }
                continue; // Skip further processing inside comment.
            }
            // --- Keywords and operators ---
            else if (line.substring(charIndex, charIndex + 5) === "print") {
                tokens.push({ type: "PRINT", lexeme: "print", line: lineNumber + 1, column: charIndex + 1 });
                output += `DEBUG Lexer - PRINT [ print ] found on line ${lineNumber + 1}\n`;
                charIndex += 4;
            }
            else if (line.substring(charIndex, charIndex + 5) === "while") {
                tokens.push({ type: "WHILE", lexeme: "while", line: lineNumber + 1, column: charIndex + 1 });
                output += `DEBUG Lexer - WHILE [ while ] found on line ${lineNumber + 1}\n`;
                charIndex += 4;
            }
            else if (line.substring(charIndex, charIndex + 2) === "if") {
                tokens.push({ type: "IFSTATEMENT", lexeme: "if", line: lineNumber + 1, column: charIndex + 1 });
                output += `DEBUG Lexer - IFSTATEMENT [ if ] found on line ${lineNumber + 1}\n`;
                charIndex++;
            }
            else if (line.substring(charIndex, charIndex + 4) === "true") {
                tokens.push({ type: "BOOLVALT", lexeme: "true", line: lineNumber + 1, column: charIndex + 1 });
                output += `DEBUG Lexer - BOOLVALT [ true ] found on line ${lineNumber + 1}\n`;
                charIndex += 3;
            }
            else if (line.substring(charIndex, charIndex + 5) === "false") {
                tokens.push({ type: "BOOLVALF", lexeme: "false", line: lineNumber + 1, column: charIndex + 1 });
                output += `DEBUG Lexer - BOOLVALF [ false ] found on line ${lineNumber + 1}\n`;
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
                tokens.push({ type: "ITYPE", lexeme: typeLexeme, line: lineNumber + 1, column: charIndex + 1 });
                output += `DEBUG Lexer - ITYPE [ ${typeLexeme} ] found on line ${lineNumber + 1}\n`;
                charIndex += typeLexeme.length - 1;
            }
            // --- Assignment and comparison operators ---
            else if (char === "=") {
                if (charIndex + 1 < line.length && line[charIndex + 1] === "=") {
                    tokens.push({ type: "BOOL_EQUAL", lexeme: "==", line: lineNumber + 1, column: charIndex + 1 });
                    output += `DEBUG Lexer - BOOL_EQUAL [ == ] found on line ${lineNumber + 1}\n`;
                    charIndex++;
                }
                else {
                    tokens.push({ type: "ASSIGN_OP", lexeme: "=", line: lineNumber + 1, column: charIndex + 1 });
                    output += `DEBUG Lexer - ASSIGN_OP [ = ] found on line ${lineNumber + 1}\n`;
                }
            }
            else if (char === "!" && charIndex + 1 < line.length && line[charIndex + 1] === "=") {
                tokens.push({ type: "BOOL_INEQUAL", lexeme: "!=", line: lineNumber + 1, column: charIndex + 1 });
                output += `DEBUG Lexer - BOOL_INEQUAL [ != ] found on line ${lineNumber + 1}\n`;
                charIndex++;
            }
            else if (char === "+") {
                tokens.push({ type: "INTOP", lexeme: "+", line: lineNumber + 1, column: charIndex + 1 });
                output += `DEBUG Lexer - INTOP [ + ] found on line ${lineNumber + 1}\n`;
            }
            // --- String Expressions ---
            else if (char === '"') {
                tokens.push({ type: "LQUOTE", lexeme: "\"", line: lineNumber + 1, column: charIndex + 1 });
                output += `DEBUG Lexer - StringExpr [ start " ] found on line ${lineNumber + 1}\n`;
                charIndex++; // move past the opening quote
                while (charIndex < line.length) {
                    if (line[charIndex] === '"') {
                        tokens.push({ type: "RQUOTE", lexeme: "\"", line: lineNumber + 1, column: charIndex + 1 });
                        output += `DEBUG Lexer - StringExpr [ end " ] found on line ${lineNumber + 1}\n`;
                        break;
                    }
                    else {
                        let currentChar = line[charIndex];
                        if ((currentChar >= "a" && currentChar <= "z") || currentChar === " ") {
                            tokens.push({ type: "CHAR", lexeme: currentChar, line: lineNumber + 1, column: charIndex + 1 });
                            output += `DEBUG Lexer - char [ ${currentChar} ] found on line ${lineNumber + 1}\n`;
                        }
                        else {
                            output += `ERROR Lexer - Error: line ${lineNumber + 1} Unrecognized Token: ${currentChar} Only lowercase letters a through z and spaces are allowed in strings\n`;
                            output += `Error Lexer - Lex failed with ${errors + 1} error(s)\n\n`;
                            compileCode(output);
                            return { tokens, output, errors: errors + 1 };
                        }
                    }
                    charIndex++;
                }
                if (charIndex >= line.length || line[charIndex] !== '"') {
                    output += `ERROR Lexer - Error: Unterminated StringExpr starting on line ${lineNumber + 1}. Lexing terminated due to fatal error.\n`;
                    output += `Error Lexer - Lex failed with ${errors + 1} error(s)\n\n`;
                    compileCode(output);
                    return { tokens, output, errors: errors + 1 };
                }
            }
            // --- Digits ---
            else if (/[0-9]/.test(char)) {
                tokens.push({ type: "DIGIT", lexeme: char, line: lineNumber + 1, column: charIndex + 1 });
                output += `DEBUG Lexer - DIGIT [ ${char} ] found on line ${lineNumber + 1}\n`;
            }
            // --- Identifiers (a single character) ---
            else if (char >= "a" && char <= "z") {
                tokens.push({ type: "ID", lexeme: char, line: lineNumber + 1, column: charIndex + 1 });
                output += `DEBUG Lexer - ID [ ${char} ] found on line ${lineNumber + 1}\n`;
            }
            // --- Ignore whitespace ---
            else if (char === " " || char === "\t") {
                // do nothing
            }
            // --- Unrecognized token ---
            else {
                errors++;
                output += `ERROR Lexer - Error: line ${lineNumber + 1} Unrecognized Token: ${char} Please reference grammar guide.\n`;
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
// re-appends "$" to each program (so each ends with the EOP marker), lexes and then parses each.
function processPrograms() {
    let finalOutput = "";
    const inputElement = document.getElementById("userInput");
    const text = inputElement.value;
    if (!text.trim().endsWith("$")) {
        compileCode(`ERROR: Last character of input must be "$".\n`);
        return;
    }
    // Split input into programs without stripping newlines.
    const rawPrograms = text.split("$");
    const programs = [];
    for (const raw of rawPrograms) {
        if (raw.length > 0) {
            programs.push(raw + "$");
        }
    }
    let programNumber = 1;
    for (const progText of programs) {
        const lexResult = lexProgram(progText);
        finalOutput += `DEBUG: Running in verbose mode \n\n`;
        let compileOutput = `LEXER - Lexing program ${programNumber}...\n` + lexResult.output;
        if (lexResult.errors > 0) {
            compileOutput += `Error Lexer - Lex failed with ${lexResult.errors} error(s)\n\n`;
        }
        else {
            compileOutput += `LEXER - Lex completed with ${lexResult.errors} error(s)\n\n`;
            const parserInstance = new Parser(lexResult.tokens);
            const result = parserInstance.parse();
            compileOutput += result.output;
            if (result.error) {
                compileOutput += `\nPARSER ERROR: ${result.error}\n`;
                compileOutput += `CST for program ${programNumber}: Skipped due to PARSER error(s).\n`;
            }
            else if (result.tree) {
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
        this.parseStatementList();
        this.match("RBRACE");
        this.cst.moveUp();
    }
    // StatementList ::= Statement StatementList | ε
    parseStatementList() {
        this.output += "PARSER: parseStatementList()\n";
        this.cst.addNode("branch", "StatementList");
        const token = this.peekToken();
        if (token && (token.type === "RBRACE" || token.type === "EOP")) {
            this.cst.addNode("leaf", "ε");
        }
        else {
            this.parseStatement();
            this.parseStatementList();
        }
        this.cst.moveUp();
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
    print(node = this.root, indent = "") {
        if (!node)
            return "";
        let result = indent + `<${node.label}>\n`;
        for (const child of node.children) {
            result += this.print(child, indent + "  ");
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