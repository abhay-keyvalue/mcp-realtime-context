import { ContextCreate, ContextType, ContextSource } from '@mcp/shared-types';

interface NormalizedInput {
  type: ContextType;
  title: string;
  description: string;
  tags: string[];
  confidence: number;
}

export class ContextEngineService {
  /**
   * Normalize free-text input into structured context
   */
  normalizeInput(input: string, source: ContextSource): NormalizedInput {
    const normalized: NormalizedInput = {
      type: this.detectType(input),
      title: this.extractTitle(input),
      description: input.trim(),
      tags: this.extractTags(input),
      confidence: this.calculateConfidence(input, source),
    };

    return normalized;
  }

  /**
   * Detect context type from input text
   */
  private detectType(input: string): ContextType {
    const lower = input.toLowerCase();

    // API-related keywords
    if (
      lower.includes('api') ||
      lower.includes('endpoint') ||
      lower.includes('rest') ||
      lower.includes('graphql') ||
      lower.includes('/api/')
    ) {
      return 'api';
    }

    // Bug-related keywords
    if (
      lower.includes('bug') ||
      lower.includes('fix') ||
      lower.includes('error') ||
      lower.includes('issue') ||
      lower.includes('broken')
    ) {
      return 'bug';
    }

    // Decision-related keywords
    if (
      lower.includes('decision') ||
      lower.includes('architecture') ||
      lower.includes('approach') ||
      lower.includes('strategy') ||
      lower.includes('chose') ||
      lower.includes('decided')
    ) {
      return 'decision';
    }

    // WIP-related keywords
    if (
      lower.includes('wip') ||
      lower.includes('work in progress') ||
      lower.includes('working on') ||
      lower.includes('currently') ||
      lower.includes('in progress')
    ) {
      return 'wip';
    }

    // Default to feature
    return 'feature';
  }

  /**
   * Extract a concise title from input
   */
  private extractTitle(input: string): string {
    const sentences = input.split(/[.!?]+/);
    let firstSentence = sentences[0].trim();

    // Limit title length
    if (firstSentence.length > 100) {
      firstSentence = firstSentence.substring(0, 97) + '...';
    }

    return firstSentence || 'Untitled Context';
  }

  /**
   * Extract relevant tags from input
   */
  private extractTags(input: string): string[] {
    const tags: Set<string> = new Set();
    const lower = input.toLowerCase();

    // Technology tags
    const technologies = [
      'react', 'vue', 'angular', 'node', 'python', 'java', 'go', 'rust',
      'typescript', 'javascript', 'api', 'database', 'redis', 'postgres',
      'mongodb', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
    ];

    technologies.forEach(tech => {
      if (lower.includes(tech)) {
        tags.add(tech);
      }
    });

    // Extract hashtags
    const hashtagMatches = input.match(/#[\w-]+/g);
    if (hashtagMatches) {
      hashtagMatches.forEach(tag => {
        tags.add(tag.substring(1).toLowerCase());
      });
    }

    return Array.from(tags);
  }

  /**
   * Calculate confidence score based on input quality
   */
  private calculateConfidence(input: string, source: ContextSource): number {
    let confidence = 50;

    // Source-based confidence
    if (source === 'manual') {
      confidence += 20;
    } else if (source === 'git') {
      confidence += 15;
    } else if (source === 'ai') {
      confidence += 10;
    }

    // Length-based confidence
    if (input.length > 100) {
      confidence += 10;
    }
    if (input.length > 300) {
      confidence += 10;
    }

    // Structure-based confidence
    if (input.includes('\n')) {
      confidence += 5;
    }

    // Code snippets indicate higher quality
    if (input.includes('```') || input.includes('`')) {
      confidence += 10;
    }

    return Math.min(confidence, 100);
  }

  /**
   * Check for duplicate contexts based on similarity
   */
  async checkDuplicate(
    title: string,
    existingContexts: Array<{ title: string; description: string }>
  ): Promise<{ isDuplicate: boolean; similarity: number; matchId?: string }> {
    // Simple duplicate detection using title similarity
    const titleLower = title.toLowerCase();

    for (const existing of existingContexts) {
      const existingLower = existing.title.toLowerCase();
      const similarity = this.calculateSimilarity(titleLower, existingLower);

      if (similarity > 0.8) {
        return {
          isDuplicate: true,
          similarity,
        };
      }
    }

    return { isDuplicate: false, similarity: 0 };
  }

  /**
   * Simple Levenshtein-based similarity calculation
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Auto-tag existing context based on content analysis
   */
  autoTag(description: string): string[] {
    return this.extractTags(description);
  }
}

export const contextEngineService = new ContextEngineService();
