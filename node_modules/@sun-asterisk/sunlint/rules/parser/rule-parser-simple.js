const { RuleParser } = require("./rule-parser")
const fs = require("fs")
const path = require("path")

/**
 * Simple Rule Parser - Lightweight wrapper around RuleParser
 * Provides simplified interface for basic rule information extraction
 * Focused on English rules (*-en.md) with filtering capabilities
 */
class SimpleRuleParser {
  constructor() {
    // Use existing RuleParser as core engine, but disable migrate mode
    this.coreParser = new RuleParser(false)
    this.rulesCache = new Map() // Cache parsed rules by file
  }

  /**
   * Parse a specific markdown file and extract basic rule information
   * @param {string} filePath - Path to the markdown file
   * @returns {Array} Array of simplified rule objects
   */
  parseRuleFile(filePath) {
    try {
      // Check cache first
      if (this.rulesCache.has(filePath)) {
        return this.rulesCache.get(filePath)
      }

      // Use default config for parsing
      const defaultConfig = {
        category: "Common",
        language: "All languages", 
        framework: "All"
      }
      
      // Parse using core parser
      const fullRules = this.coreParser.parseMarkdownFile(filePath, defaultConfig)
      
      // Convert to simplified format
      const simplifiedRules = fullRules.map(rule => this.simplifyRule(rule))
      
      // Cache the result
      this.rulesCache.set(filePath, simplifiedRules)
      
      return simplifiedRules
    } catch (error) {
      console.error(`Error parsing file ${filePath}:`, error.message)
      return []
    }
  }

  /**
   * Parse all English rule files from rules directory
   * @param {string} rulesDir - Path to rules directory (default: relative to this script)
   * @returns {Array} Array of all simplified rule objects
   */
  parseAllRules(rulesDir = null) {
    try {
      if (!rulesDir) {
        rulesDir = path.join(__dirname, "..", "..", "origin-rules")
      }

      if (!fs.existsSync(rulesDir)) {
        throw new Error(`Rules directory not found: ${rulesDir}`)
      }

      const allRules = []
      const files = fs.readdirSync(rulesDir)
      
      // Find all English rule files (*-en.md)
      const englishRuleFiles = files.filter(file => 
        file.endsWith('-en.md') && file !== 'README-en.md'
      )

      console.log(`Found ${englishRuleFiles.length} English rule files: ${englishRuleFiles.join(', ')}`)

      for (const file of englishRuleFiles) {
        const filePath = path.join(rulesDir, file)
        const rules = this.parseRuleFile(filePath)
        allRules.push(...rules)
      }

      return allRules
    } catch (error) {
      console.error("Error parsing all rules:", error.message)
      return []
    }
  }

  /**
   * Filter rules by various criteria
   * @param {Array} rules - Array of rules to filter
   * @param {Object} filters - Filter criteria
   * @param {string} filters.ruleId - Specific rule ID (e.g., "C001")
   * @param {string|Array} filters.principles - Principle(s) to match (e.g., "Quality", ["Security", "Performance"])
   * @param {string} filters.framework - Framework to match (e.g., "Android")
   * @param {string} filters.language - Language to match (e.g., "Java")
   * @param {string} filters.minVersion - Minimum version (e.g., "1.0")
   * @param {string} filters.status - Status to match (default: "activated")
   * @returns {Array} Filtered rules
   */
  filterRules(rules, filters = {}) {
    try {
      let filteredRules = [...rules]

      // Default filters: version >= 1.0 and status = activated
      const {
        ruleId,
        principles,
        framework,
        language,
        minVersion = "1.0",
        status // No default for status when looking for specific ruleId
      } = filters

      // Filter by specific rule ID first (no status filter needed)
      if (ruleId) {
        filteredRules = filteredRules.filter(rule => 
          rule.id && rule.id.toLowerCase() === ruleId.toLowerCase()
        )
        // If searching by ID, return early (no other filters needed)
        return filteredRules
      }

      // Filter by status (default: activated) only when not searching by ID
      const defaultStatus = status || "activated"
      filteredRules = filteredRules.filter(rule => 
        rule.status && rule.status.toLowerCase() === defaultStatus.toLowerCase()
      )

      // Filter by minimum version
      if (minVersion) {
        filteredRules = filteredRules.filter(rule => 
          this.compareVersions(rule.version || "1.0", minVersion) >= 0
        )
      }

      // Filter by principles
      if (principles) {
        const principlesArray = Array.isArray(principles) ? principles : [principles]
        filteredRules = filteredRules.filter(rule => {
          if (!rule.principles || rule.principles.length === 0) return false
          return principlesArray.some(principle => 
            rule.principles.some(rulePrinciple => 
              rulePrinciple.toLowerCase().includes(principle.toLowerCase())
            )
          )
        })
      }

      // Filter by framework
      if (framework) {
        filteredRules = filteredRules.filter(rule => 
          rule.framework && rule.framework.toLowerCase().includes(framework.toLowerCase())
        )
      }

      // Filter by language
      if (language) {
        filteredRules = filteredRules.filter(rule => 
          rule.language && (
            rule.language.toLowerCase().includes(language.toLowerCase()) ||
            rule.language.toLowerCase().includes('all')
          )
        )
      }

      return filteredRules
    } catch (error) {
      console.error("Error filtering rules:", error.message)
      return rules
    }
  }

  /**
   * Get rules by principles (common use case)
   * @param {string|Array} principles - Principle(s) to search for
   * @param {string} rulesDir - Rules directory path
   * @returns {Array} Rules matching the principles
   */
  getRulesByPrinciples(principles, rulesDir = null) {
    const allRules = this.parseAllRules(rulesDir)
    return this.filterRules(allRules, { principles })
  }

  /**
   * Get rules for specific framework
   * @param {string} framework - Framework name (e.g., "Android", "React")
   * @param {string} rulesDir - Rules directory path
   * @returns {Array} Rules for the framework
   */
  getRulesByFramework(framework, rulesDir = null) {
    const allRules = this.parseAllRules(rulesDir)
    return this.filterRules(allRules, { framework })
  }

  /**
   * Get single rule by ID
   * @param {string} ruleId - Rule ID (e.g., "C001")
   * @param {string} rulesDir - Rules directory path
   * @returns {Object|null} Rule object or null if not found
   */
  getRuleById(ruleId, rulesDir = null) {
    try {
      const allRules = this.parseAllRules(rulesDir)
      const filtered = this.filterRules(allRules, { ruleId })
      return filtered.length > 0 ? filtered[0] : null
    } catch (error) {
      console.error("Error in getRuleById:", error.message)
      return null
    }
  }

  /**
   * Compare version strings (supports x.y format)
   * @param {string} version1 - First version
   * @param {string} version2 - Second version
   * @returns {number} -1 if version1 < version2, 0 if equal, 1 if version1 > version2
   */
  compareVersions(version1, version2) {
    try {
      const v1Parts = version1.split('.').map(Number)
      const v2Parts = version2.split('.').map(Number)
      
      const maxLength = Math.max(v1Parts.length, v2Parts.length)
      
      for (let i = 0; i < maxLength; i++) {
        const v1Part = v1Parts[i] || 0
        const v2Part = v2Parts[i] || 0
        
        if (v1Part < v2Part) return -1
        if (v1Part > v2Part) return 1
      }
      
      return 0
    } catch (error) {
      console.warn(`Error comparing versions ${version1} and ${version2}:`, error.message)
      return 0
    }
  }

  /**
   * Convert full rule object to simplified format
   * @param {Object} fullRule - Full rule object from RuleParser
   * @returns {Object} Simplified rule object
   */
  simplifyRule(fullRule) {
    return {
      id: fullRule.id,
      title: fullRule.title,
      description: fullRule.description,
      details: fullRule.details || [],
      tools: fullRule.tools || [],
      principles: fullRule.principles || [],
      version: fullRule.version,
      status: fullRule.status,
      severity: fullRule.severity,
      language: fullRule.language,
      framework: fullRule.framework,
      category: fullRule.category
      // Exclude examples and configs for lightweight usage
    }
  }
}

// Factory functions for easy use (maintaining backward compatibility)
function parseRuleFile(filePath) {
  const parser = new SimpleRuleParser()
  return parser.parseRuleFile(filePath)
}

function parseAllRules(rulesDir = null) {
  const parser = new SimpleRuleParser()
  return parser.parseAllRules(rulesDir)
}

function filterRules(rules, filters = {}) {
  const parser = new SimpleRuleParser()
  return parser.filterRules(rules, filters)
}

function getRulesByPrinciples(principles, rulesDir = null) {
  const parser = new SimpleRuleParser()
  return parser.getRulesByPrinciples(principles, rulesDir)
}

function getRulesByFramework(framework, rulesDir = null) {
  const parser = new SimpleRuleParser()
  return parser.getRulesByFramework(framework, rulesDir)
}

function getRuleById(ruleId, rulesDir = null) {
  const parser = new SimpleRuleParser()
  return parser.getRuleById(ruleId, rulesDir)
}

module.exports = {
  SimpleRuleParser,
  parseRuleFile,
  parseAllRules,
  filterRules,
  getRulesByPrinciples,
  getRulesByFramework,
  getRuleById
}
