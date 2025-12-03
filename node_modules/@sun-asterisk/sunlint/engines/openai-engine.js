/**
 * OpenAI Analysis Engine Plugin
 * Following Rule C005: Single responsibility - AI-powered analysis
 * Following Rule C014: Dependency injection - implements interface
 * Following Rule C015: Use domain language - clear AI analysis terms
 */

const AnalysisEngineInterface = require('../core/interfaces/analysis-engine.interface');
const fs = require('fs');

class OpenAIEngine extends AnalysisEngineInterface {
  constructor() {
    super('openai', '1.0', ['typescript', 'javascript', 'dart', 'swift', 'kotlin', 'all']);
    
    this.apiKey = null;
    this.model = 'gpt-4o-mini';
    this.provider = 'openai';
    this.aiRulesContext = {};
    this.supportedRulesList = [];
  }

  /**
   * Initialize OpenAI engine with configuration
   * Following Rule C006: Verb-noun naming
   * @param {Object} config - Engine configuration
   */
  async initialize(config) {
    try {
      // Set up API configuration
      this.apiKey = process.env.OPENAI_API_KEY || config.apiKey;
      this.model = config.model || 'gpt-4o-mini';
      this.provider = config.provider || 'openai';
      
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY environment variable.');
      }
      
      // Load AI rules context
      this.loadAIRulesContext();
      
      // Test connection
      await this.testConnection();
      
      this.initialized = true;
      console.log(`🤖 OpenAI engine initialized with model ${this.model}`);
      
    } catch (error) {
      console.error('Failed to initialize OpenAI engine:', error.message);
      throw error;
    }
  }

  /**
   * Load AI rules context configuration
   * Following Rule C006: Verb-noun naming
   */
  loadAIRulesContext() {
    try {
      const contextPath = require('path').resolve(__dirname, '../config/defaults/ai-rules-context.json');
      if (fs.existsSync(contextPath)) {
        const contextData = require(contextPath);
        this.aiRulesContext = contextData.rules || {};
        this.supportedRulesList = Object.keys(this.aiRulesContext);
        console.log(`📋 Loaded AI context for ${this.supportedRulesList.length} rules`);
      } else {
        console.warn('⚠️ AI rules context not found, using basic support');
        // Fallback to basic rules that we know work
        this.supportedRulesList = ['C006', 'C019', 'C029', 'C031'];
        this.aiRulesContext = this.createBasicRulesContext();
      }
    } catch (error) {
      console.warn('⚠️ Failed to load AI rules context:', error.message);
      this.supportedRulesList = ['C019']; // Minimum fallback
      this.aiRulesContext = this.createFallbackContext();
    }
  }

  /**
   * Create basic rules context for common rules
   * Following Rule C006: Verb-noun naming
   * @returns {Object} Basic rules context
   */
  createBasicRulesContext() {
    return {
      'C006': {
        name: 'Function Naming Convention',
        context: 'Analyze function naming patterns for verb-noun convention',
        focus_areas: ['function declarations', 'method names', 'arrow functions'],
        severity: 'warning'
      },
      'C019': {
        name: 'Log Level Usage',
        context: 'Analyze logging patterns for appropriate error levels',
        focus_areas: ['console.error', 'logger.error', 'log levels'],
        severity: 'warning'
      },
      'C029': {
        name: 'Catch Block Error Logging',
        context: 'Analyze error handling in catch blocks',
        focus_areas: ['try-catch blocks', 'error logging', 'exception handling'],
        severity: 'error'
      },
      'C031': {
        name: 'Validation Logic Separation',
        context: 'Analyze separation of validation logic from business logic',
        focus_areas: ['validation functions', 'business logic', 'separation of concerns'],
        severity: 'error'
      }
    };
  }

  /**
   * Create fallback context for minimal support
   * Following Rule C006: Verb-noun naming
   * @returns {Object} Fallback context
   */
  createFallbackContext() {
    return {
      'C019': {
        name: 'Log Level Usage',
        context: 'Analyze logging patterns for appropriate error levels',
        focus_areas: ['console.error', 'logger.error', 'log levels'],
        severity: 'warning'
      }
    };
  }

  /**
   * Analyze files using OpenAI
   * Following Rule C006: Verb-noun naming
   * @param {string[]} files - Files to analyze
   * @param {Object[]} rules - Rules to apply
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   */
  async analyze(files, rules, options) {
    if (!this.initialized) {
      throw new Error('OpenAI engine not initialized');
    }

    const results = {
      results: [],
      filesAnalyzed: files.length,
      engine: 'openai',
      metadata: {
        model: this.model,
        rulesAnalyzed: rules.map(r => r.id)
      }
    };

    for (const filePath of files) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const fileViolations = [];

        // Analyze each rule for this file
        for (const rule of rules) {
          if (!this.isRuleSupported(rule.id)) {
            console.warn(`⚠️ Rule ${rule.id} not supported by OpenAI engine, skipping...`);
            continue;
          }

          const ruleViolations = await this.analyzeRuleForFile(filePath, fileContent, rule);
          fileViolations.push(...ruleViolations);
        }

        if (fileViolations.length > 0) {
          results.results.push({
            file: filePath,
            violations: fileViolations
          });
        }

      } catch (error) {
        console.error(`❌ Failed to analyze ${filePath}:`, error.message);
        // Continue with other files
      }
    }

    return results;
  }

  /**
   * Analyze a specific rule for a file using AI
   * Following Rule C006: Verb-noun naming
   * @param {string} filePath - File path
   * @param {string} content - File content
   * @param {Object} rule - Rule to analyze
   * @returns {Promise<Object[]>} Rule violations
   */
  async analyzeRuleForFile(filePath, content, rule) {
    const ruleContext = this.aiRulesContext[rule.id];
    if (!ruleContext) {
      return [];
    }

    try {
      const prompt = this.buildDynamicPrompt(content, rule, ruleContext);
      const aiResponse = await this.callOpenAI(prompt);
      return this.parseAIResponse(aiResponse, filePath, rule.id);
    } catch (error) {
      console.error(`❌ AI analysis failed for rule ${rule.id}:`, error.message);
      return [];
    }
  }

  /**
   * Build dynamic prompt based on rule context
   * Following Rule C006: Verb-noun naming
   * @param {string} content - File content
   * @param {Object} rule - Rule object
   * @param {Object} ruleContext - Rule-specific context
   * @returns {string} Generated prompt
   */
  buildDynamicPrompt(content, rule, ruleContext) {
    return `You are a code quality expert analyzing code for ${ruleContext.name}.

RULE: ${rule.id} - ${rule.name || ruleContext.name}
CONTEXT: ${ruleContext.context}
DESCRIPTION: ${rule.description || ruleContext.name}

FOCUS AREAS: ${ruleContext.focus_areas.join(', ')}

ANALYZE THIS CODE:
\`\`\`
${content}
\`\`\`

SPECIFIC INSTRUCTIONS:
- Only analyze for the specified rule and focus areas
- Be precise about line numbers and column positions
- Provide actionable suggestions for fixes
- Do not analyze other code quality issues outside the focus areas

RESPOND WITH JSON FORMAT:
{
  "violations": [
    {
      "line": <line_number>,
      "column": <column_number>, 
      "message": "<specific_violation_description>",
      "severity": "${ruleContext.severity}",
      "code": "<code_snippet>",
      "suggestion": "<how_to_fix>"
    }
  ],
  "summary": "<overall_assessment>"
}

Be precise and focused only on the rule: ${rule.id}`;
  }

  /**
   * Call OpenAI API
   * Following Rule C006: Verb-noun naming
   * @param {string} prompt - Prompt to send
   * @returns {Promise<string>} AI response
   */
  async callOpenAI(prompt) {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert code analyzer. Provide precise, actionable feedback focused only on the specified rule.'
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Parse AI response into violation format
   * Following Rule C006: Verb-noun naming
   * @param {string} aiResponse - AI response text
   * @param {string} filePath - File path
   * @param {string} ruleId - Rule ID
   * @returns {Object[]} Parsed violations
   */
  parseAIResponse(aiResponse, filePath, ruleId) {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️ No JSON found in AI response');
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.violations || !Array.isArray(parsed.violations)) {
        console.warn('⚠️ Invalid violations format in AI response');
        return [];
      }

      return parsed.violations.map(violation => ({
        line: violation.line || 1,
        column: violation.column || 1,
        message: violation.message || 'AI detected violation',
        severity: violation.severity || 'warning',
        ruleId: ruleId, // ✅ Dynamic rule ID instead of hardcoded
        code: violation.code || '',
        suggestion: violation.suggestion || '',
        file: filePath,
        source: 'ai'
      }));

    } catch (error) {
      console.error('Failed to parse AI response:', error.message);
      return [];
    }
  }

  /**
   * Get supported rules
   * Following Rule C006: Verb-noun naming
   * @returns {string[]} Supported rule IDs
   */
  getSupportedRules() {
    return this.supportedRulesList;
  }

  /**
   * Test connection to OpenAI API
   * Following Rule C006: Verb-noun naming
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    try {
      const testPrompt = 'Respond with: {"status": "ok"}';
      await this.callOpenAI(testPrompt);
      return { success: true, provider: this.provider, model: this.model };
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  /**
   * Cleanup OpenAI engine resources
   * Following Rule C006: Verb-noun naming
   */
  async cleanup() {
    // OpenAI doesn't require specific cleanup
    await super.cleanup();
    console.log('🤖 OpenAI engine cleanup completed');
  }
}

module.exports = OpenAIEngine;
