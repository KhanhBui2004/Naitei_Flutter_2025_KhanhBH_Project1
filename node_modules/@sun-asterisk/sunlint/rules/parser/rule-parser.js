const fs = require("fs")
const { KEYWORDS } = require("./constants")

class RuleParser {
  constructor(isMigrateMode = false) {
    this.isMigrateMode = isMigrateMode
  }

  // Parse a markdown file and extract rules
  parseMarkdownFile(filePath, config) {
    try {
      const content = fs.readFileSync(filePath, "utf8")
      const rules = []

      // Split content by rule sections (### 📘 Rule)
      const ruleSections = content.split(/### 📘 Rule\s+/)

      // If no sections found with the prefix, try to parse the whole file as one rule
      if (ruleSections.length <= 1) {
        const ruleMatch = content.match(/### 📘 Rule\s+([A-Za-z]+\d+)\s*[–-]\s*(.+)/)
        if (ruleMatch) {
          const [fullMatch, id, title] = ruleMatch
          const rule = this.parseRuleContent(content, id, title, config)
          if (rule) {
            rules.push(rule)
          }
        } else {
          console.warn("Could not find any rule in file:", filePath)
        }
        return rules
      }

      // Skip first section (header)
      for (let i = 1; i < ruleSections.length; i++) {
        const section = ruleSections[i]
        const rule = this.parseRuleSection(section, config)
        if (rule) {
          rules.push(rule)
        }
      }

      return rules
    } catch (error) {
      console.error(`Error parsing file ${filePath}:`, error.message)
      return []
    }
  }

  // Parse a single rule section
  parseRuleSection(section, config) {
    try {
      const lines = section.split("\n")
      const firstLine = lines[0]

      // Extract rule ID and title
      const titleMatch = firstLine.match(/^([A-Z]+\d+)\s*[–-]\s*(.+)$/)
      if (!titleMatch) {
        console.warn("Could not parse rule title:", firstLine)
        return null
      }

      const [, id, title] = titleMatch
      return this.parseRuleContent(section, id, title, config)
    } catch (error) {
      console.error("Error parsing rule section:", error.message)
      return null
    }
  }

  // Parse rule content and extract all rule information
  parseRuleContent(content, id, title, config) {
    try {
      // Initialize rule object
      const rule = this.createRuleObject(id, title, config)
      const lines = content.split("\n")

      const parsingState = this.createParsingState()

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        this.processLine(line, rule, parsingState, lines, i)
      }

      // In normal mode, read examples and configs from separate files
      if (!this.isMigrateMode) {
        const externalData = this.readExamplesFromFile(rule.id)
        rule.examples = externalData.examples
        rule.configs = externalData.configs
      }

      console.log(
          `Parsed rule ${rule.id}: ${rule.examples.good.length} good examples, ${rule.examples.bad.length} bad examples, ${Object.keys(rule.configs).length} configs`,
      )
      return rule
    } catch (error) {
      console.error("Error parsing rule content:", error.message)
      return null
    }
  }

  // Create initial rule object
  createRuleObject(id, title, config) {
    return {
      id: id.trim(),
      title: title.trim(),
      category: config.category,
      language: config.language,
      framework: config.framework,
      description: "",
      details: [],
      tools: [],
      principles: [],
      severity: "major", // default severity
      version: "1.0",
      status: "activated",
      examples: {
        good: [],
        bad: [],
      },
      configs: {},
    }
  }

  // Create parsing state object
  createParsingState() {
    return {
      currentSection: null,
      inGoodExample: false,
      inBadExample: false,
      inConfig: false,
      currentConfigType: null,
      inCodeBlock: false,
      currentCodeLanguage: null,
      currentCodeContent: [],
      lastHeaderLine: "",
    }
  }

  // Process a single line during parsing
  processLine(line, rule, state, lines, lineIndex) {
    // Handle code blocks (only in migrate mode)
    if (line.trim().startsWith("```") && this.isMigrateMode) {
      this.handleCodeBlock(line, rule, state, lines, lineIndex)
      return
    }

    if (state.inCodeBlock && this.isMigrateMode) {
      state.currentCodeContent.push(line)
      return
    }

    // Check for section headers and update rule properties
    this.processKeywordLine(line, rule, state)
  }

  // Handle code block processing
  handleCodeBlock(line, rule, state, lines, lineIndex) {
    if (!state.inCodeBlock) {
      // Start of code block
      state.inCodeBlock = true
      const langMatch = line.trim().match(/^```(\w+)/)
      state.currentCodeLanguage = langMatch ? langMatch[1] : "text"
      state.currentCodeContent = []

      // Store the last header line to determine context
      if (lineIndex > 0) {
        for (let j = lineIndex - 1; j >= 0; j--) {
          const prevLine = lines[j].trim()
          if (prevLine && !prevLine.startsWith("```")) {
            state.lastHeaderLine = prevLine
            break
          }
        }
      }
    } else {
      // End of code block
      this.processEndOfCodeBlock(rule, state)
    }
  }

  // Process end of code block
  processEndOfCodeBlock(rule, state) {
    state.inCodeBlock = false
    const codeContent = state.currentCodeContent.join("\n")

    if (state.inGoodExample) {
      rule.examples.good.push({
        language: state.currentCodeLanguage,
        code: codeContent,
      })
      console.log(`Added good example for rule ${rule.id} (${state.currentCodeLanguage})`)
    } else if (state.inBadExample) {
      rule.examples.bad.push({
        language: state.currentCodeLanguage,
        code: codeContent,
      })
      console.log(`Added bad example for rule ${rule.id} (${state.currentCodeLanguage})`)
    } else if (state.inConfig || state.lastHeaderLine.includes("Config")) {
      // This is a config block - extract config type from header
      const configType = this.extractConfigType(state.lastHeaderLine)
      rule.configs[configType] = codeContent
      console.log(`Added config for rule ${rule.id} (${configType}) from header: ${state.lastHeaderLine}`)
    } else if (["json", "xml", "yaml", "toml", "properties"].includes(state.currentCodeLanguage)) {
      // Default config based on language
      rule.configs[state.currentCodeLanguage] = codeContent
      console.log(`Added config for rule ${rule.id} based on language: ${state.currentCodeLanguage}`)
    } else {
      // Default to good example if no clear context
      rule.examples.good.push({
        language: state.currentCodeLanguage,
        code: codeContent,
      })
      console.log(`Added default example for rule ${rule.id} (${state.currentCodeLanguage})`)
    }

    state.currentCodeContent = []
    state.lastHeaderLine = ""
    state.currentConfigType = null
  }

  // Process lines with keywords
  processKeywordLine(line, rule, state) {
    if (this.containsKeyword(line, "OBJECTIVE")) {
      state.currentSection = "objective"
      const objectiveText = this.extractValueAfterKeyword(line, "OBJECTIVE")
      if (objectiveText) {
        rule.description = objectiveText
      }
      this.resetParsingFlags(state)
    } else if (this.containsKeyword(line, "DETAILS")) {
      state.currentSection = "details"
      const detailText = this.extractValueAfterKeyword(line, "DETAILS")
      if (detailText) {
        rule.details.push(detailText)
      }
      this.resetParsingFlags(state)
    } else if (this.containsKeyword(line, "APPLIES_TO")) {
      const appliesTo = this.extractValueAfterKeyword(line, "APPLIES_TO")
      if (appliesTo) {
        rule.language = this.parseLanguages(appliesTo, rule.language)
      }
      this.resetParsingState(state)
    } else if (this.containsKeyword(line, "TOOLS")) {
      const tools = this.extractValueAfterKeyword(line, "TOOLS")
      if (tools) {
        rule.tools = this.parseCommaSeparatedValues(tools)
      }
      this.resetParsingState(state)
    } else if (this.containsKeyword(line, "PRINCIPLES")) {
      const principles = this.extractValueAfterKeyword(line, "PRINCIPLES")
      if (principles) {
        rule.principles = this.parseCommaSeparatedValues(principles)
      }
      this.resetParsingState(state)
    } else if (this.containsKeyword(line, "VERSION")) {
      rule.version = this.extractValueAfterKeyword(line, "VERSION")
      this.resetParsingState(state)
    } else if (this.containsKeyword(line, "STATUS")) {
      rule.status = this.extractValueAfterKeyword(line, "STATUS")
      this.resetParsingState(state)
    } else if (this.containsKeyword(line, "SEVERITY")) {
      const severity = this.extractValueAfterKeyword(line, "SEVERITY").toLowerCase()
      if (["critical", "major", "minor"].includes(severity)) {
        rule.severity = severity
      }
      this.resetParsingState(state)
    } else if (this.containsKeyword(line, "GOOD_EXAMPLE") && this.isMigrateMode) {
      state.inGoodExample = true
      state.inBadExample = false
      state.inConfig = false
      state.currentSection = null
      console.log(`Found good example section in rule ${rule.id}`)
    } else if (this.containsKeyword(line, "BAD_EXAMPLE") && this.isMigrateMode) {
      state.inBadExample = true
      state.inGoodExample = false
      state.inConfig = false
      state.currentSection = null
      console.log(`Found bad example section in rule ${rule.id}`)
    } else if ((line.includes("Config") || line.includes("config")) && this.isMigrateMode) {
      state.inConfig = true
      state.inGoodExample = false
      state.inBadExample = false
      state.currentSection = null
      state.currentConfigType = this.extractConfigType(line)
      console.log(`Found config section in rule ${rule.id}: ${line} (type: ${state.currentConfigType})`)
    } else if (state.currentSection === "objective" && line.trim() && !line.trim().startsWith("**") && !line.trim().startsWith("-")) {
      // Continue reading objective content on next lines
      if (rule.description) {
        rule.description += " " + line.trim()
      } else {
        rule.description = line.trim()
      }
    } else if (state.currentSection === "details" && line.trim() && !line.trim().startsWith("**")) {
      rule.details.push(line.trim())
    }
  }

  // Reset parsing state
  resetParsingState(state) {
    state.currentSection = null
    this.resetParsingFlags(state)
  }

  // Reset parsing flags
  resetParsingFlags(state) {
    state.inGoodExample = false
    state.inBadExample = false
    state.inConfig = false
  }

  // Helper function to check if a line contains any keyword pattern
  containsKeyword(line, keywordCategory) {
    if (!line) return false

    const trimmedLine = line.trim()
    const patterns = KEYWORDS[keywordCategory]

    for (const pattern of patterns) {
      if (trimmedLine.includes(pattern)) {
        return true
      }
    }
    return false
  }

  // Helper function to extract value after the keyword pattern
  extractValueAfterKeyword(line, keywordCategory) {
    if (!line) return ""

    const trimmedLine = line.trim()
    const patterns = KEYWORDS[keywordCategory]

    for (const pattern of patterns) {
      const index = trimmedLine.indexOf(pattern)
      if (index !== -1) {
        const afterPattern = trimmedLine.substring(index + pattern.length).trim()
        return afterPattern
      }
    }
    return ""
  }

  // Helper function to parse languages from "Áp dụng" field
  parseLanguages(appliesTo, defaultLanguage) {
    if (!appliesTo || appliesTo.trim() === "") {
      return defaultLanguage
    }

    // Clean up the string and split by common separators
    const cleaned = appliesTo
        .replace(/[()]/g, "") // Remove parentheses
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim()

    // Normalize language names
    let languages = this.normalizeLanguageName(cleaned)
    // Remove duplicate language
    languages = languages.filter((lang, index, self) => self.indexOf(lang) === index)

    // If we found multiple languages, join them
    if (languages.length > 1) {
      return languages.join(", ")
    } else if (languages.length === 1) {
      return languages[0]
    }

    return defaultLanguage
  }

  // Normalize language names
  normalizeLanguageName(languageName) {
    return languageName
        .split(/[,;]/)
        .map((lang) => lang.trim())
        .filter((lang) => lang.length > 0)
        .map((lang) => {
          // Normalize language names
          const normalized = lang.toLowerCase()
          if (normalized.includes("java") && !normalized.includes("javascript")) return "java"
          if (normalized.includes("python")) return "python"
          if (normalized.includes("node") || normalized.includes("javascript")) return "javascript"
          if (normalized.includes("typescript")) return "typescript"
          if (normalized.includes("kotlin")) return "kotlin"
          if (normalized.includes("swift")) return "swift"
          if (normalized.includes("dart")) return "dart"
          if (normalized.includes("go")) return "golang"
          if (normalized.includes("php")) return "php"
          if (normalized.includes("ruby")) return "ruby"
          if (normalized.includes("c#") || normalized.includes("csharp")) return "c#"
          if (normalized.includes("rust")) return "rust"
          if (normalized.includes("scala")) return "scala"

          return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
        })
  }

  // Parse comma-separated values
  parseCommaSeparatedValues(value) {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item)
  }

  // Helper function to extract config type from header
  extractConfigType(line) {
    if (!line) return "config"

    const trimmedLine = line.trim().toLowerCase()

    if (trimmedLine.includes("eslint")) return "eslint"
    if (trimmedLine.includes("tsconfig") || trimmedLine.includes("tslint")) return "typescript"
    if (trimmedLine.includes("sonarqube") || trimmedLine.includes("sonar")) return "sonarqube"
    if (trimmedLine.includes("detekt")) return "detekt"
    if (trimmedLine.includes("pmd")) return "pmd"
    if (trimmedLine.includes("prettier")) return "prettier"
    if (trimmedLine.includes("ktlint")) return "ktlint"

    return "config"
  }

  // Read examples and configs from separate files
  readExamplesFromFile(ruleId) {
    const path = require("path")

    // Try to determine current locale from environment or default to 'vi'
    const currentLocale = process.env.BUILD_LOCALE || "vi"

    const examplesDir = path.join(__dirname, "../..", "rules", "examples", currentLocale)
    const exampleFilePath = path.join(examplesDir, `${ruleId}.md`)

    // Fallback to main examples directory if locale-specific doesn't exist
    const fallbackExamplesDir = path.join(__dirname, "../..", "rules", "examples")
    const fallbackExampleFilePath = path.join(fallbackExamplesDir, `${ruleId}.md`)

    let targetFilePath = exampleFilePath
    if (!fs.existsSync(exampleFilePath) && fs.existsSync(fallbackExampleFilePath)) {
      targetFilePath = fallbackExampleFilePath
    }

    if (!fs.existsSync(targetFilePath)) {
      return {
        examples: { good: [], bad: [] },
        configs: {},
      }
    }

    try {
      const content = fs.readFileSync(targetFilePath, "utf8")
      const lines = content.split("\n")

      const examples = { good: [], bad: [] }
      const configs = {}

      let inGoodExample = false
      let inBadExample = false
      let inConfig = false
      let currentConfigType = null
      let inCodeBlock = false
      let currentCodeLanguage = null
      let currentCodeContent = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // Handle code blocks
        if (line.trim().startsWith("```")) {
          if (!inCodeBlock) {
            // Start of code block
            inCodeBlock = true
            const langMatch = line.trim().match(/^```(\w+)/)
            currentCodeLanguage = langMatch ? langMatch[1] : "text"
            currentCodeContent = []
          } else {
            // End of code block
            inCodeBlock = false
            const codeContent = currentCodeContent.join("\n")

            if (inGoodExample) {
              examples.good.push({
                language: currentCodeLanguage,
                code: codeContent,
              })
            } else if (inBadExample) {
              examples.bad.push({
                language: currentCodeLanguage,
                code: codeContent,
              })
            } else if (inConfig && currentConfigType) {
              configs[currentConfigType] = codeContent
            }

            currentCodeContent = []
          }
          continue
        }

        if (inCodeBlock) {
          currentCodeContent.push(line)
          continue
        }

        // Check for section headers - support multiple languages
        if (this.containsKeyword(line, "GOOD_EXAMPLE") || line.includes("Good Examples") || line.includes("良い例")) {
          inGoodExample = true
          inBadExample = false
          inConfig = false
        } else if (
            this.containsKeyword(line, "BAD_EXAMPLE") ||
            line.includes("Bad Examples") ||
            line.includes("悪い例")
        ) {
          inBadExample = true
          inGoodExample = false
          inConfig = false
        } else if (this.containsKeyword(line, "CONFIG") || line.includes("Config")) {
          inConfig = true
          inGoodExample = false
          inBadExample = false
          currentConfigType = this.extractConfigType(line)
        }
      }

      console.log(
          `   📖 Read examples for ${ruleId} (${currentLocale}): ${examples.good.length} good, ${examples.bad.length} bad, ${Object.keys(configs).length} configs`,
      )
      return { examples, configs }
    } catch (error) {
      console.error(`Error reading examples for ${ruleId}:`, error.message)
      return {
        examples: { good: [], bad: [] },
        configs: {},
      }
    }
  }
}

module.exports = { RuleParser }
